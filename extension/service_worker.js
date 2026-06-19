import { CONFIG } from "./config.js";

const TERMINAL_STATUSES = new Set(["saved", "error", "cancelled"]);
const RESUMABLE_STATUSES = new Set(["queued", "generating", "saving", "cancelling"]);
const JOB_STORAGE_KEY = "noteJobs";
const noteJobs = new Map();
const noteJobPorts = new Set();
let activeJobId = null;
let jobsLoaded = false;
const jobsLoadedPromise = restoreStoredJobs();

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.action === "checkLlmStatus") {
    checkLlmStatus()
      .then(sendResponse)
      .catch((error) => sendResponse({ ok: false, error: error.message }));

    return true;
  }

  if (message?.action === "listFolders") {
    listFolders()
      .then(sendResponse)
      .catch((error) => sendResponse({ ok: false, error: error.message }));

    return true;
  }

  if (message?.action !== "generateAndSaveNote") {
    return false;
  }

  generateAndSaveNote(message.payload)
    .then(sendResponse)
    .catch((error) => sendResponse({ ok: false, error: error.message }));

  return true;
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "noteJobs") {
    return;
  }

  noteJobPorts.add(port);

  port.onMessage.addListener((message) => {
    handleJobPortMessage(port, message);
  });

  port.onDisconnect.addListener(() => {
    noteJobPorts.delete(port);
  });

  jobsLoadedPromise.then(() => {
    postJobs(port, noteJobs);
    processNextJob(port, noteJobs);
  });
});

async function generateAndSaveNote({ title, folder, sourceText }) {
  const markdown = await generateMarkdown(title, sourceText);
  const saved = await saveMarkdown(title, folder, markdown);

  return {
    ok: true,
    markdown,
    path: saved.path
  };
}

async function handleJobPortMessage(port, message) {
  await jobsLoadedPromise;

  if (message?.action === "startNoteJob") {
    startNoteJob(port, noteJobs, message.job);
    return;
  }

  if (message?.action === "cancelNoteJob") {
    cancelNoteJob(port, noteJobs, message.id);
    return;
  }

  if (message?.action === "removeNoteJob") {
    removeNoteJob(port, noteJobs, message.id);
    return;
  }

  if (message?.action === "clearFinishedNoteJobs") {
    clearFinishedNoteJobs(port, noteJobs);
    return;
  }

  if (message?.action === "listNoteJobs") {
    postJobs(port, noteJobs);
    processNextJob(port, noteJobs);
  }
}

function startNoteJob(port, jobs, jobInput) {
  const job = {
    id: jobInput.id,
    title: jobInput.title,
    folder: jobInput.folder,
    sourceText: jobInput.sourceText,
    status: "queued",
    message: "Waiting to start.",
    path: "",
    markdown: "",
    error: "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    cancelled: false,
    controller: new AbortController()
  };

  jobs.set(job.id, job);
  syncJobs(port, jobs);
  processNextJob(port, jobs);
}

function processNextJob(port, jobs) {
  if (activeJobId) {
    return;
  }

  const nextJob = Array.from(jobs.values()).find((job) => job.status === "queued");
  if (!nextJob) {
    return;
  }

  activeJobId = nextJob.id;
  runNoteJob(port, jobs, nextJob);
}

async function runNoteJob(port, jobs, job) {
  try {
    setJobStatus(port, jobs, job.id, "generating", "Generating note with LM Studio.");
    const markdown = await generateMarkdown(job.title, job.sourceText, job.controller.signal);

    if (!jobs.has(job.id) || job.controller.signal.aborted) {
      throw new DOMException("Note generation was stopped.", "AbortError");
    }

    setJobStatus(port, jobs, job.id, "saving", "Saving note to Obsidian.");
    const saved = await saveMarkdown(job.title, job.folder, markdown);

    setJobStatus(port, jobs, job.id, "saved", "Saved to Obsidian.", {
      markdown,
      path: saved.path
    });
  } catch (error) {
    if (!jobs.has(job.id)) {
      return;
    }

    if (job.cancelled || error.name === "AbortError") {
      setJobStatus(port, jobs, job.id, "cancelled", "Stopped before saving.");
      return;
    }

    setJobStatus(port, jobs, job.id, "error", "Could not create this note.", {
      error: error.message || String(error)
    });
  } finally {
    const currentJob = jobs.get(job.id);
    if (currentJob) {
      currentJob.controller = null;
      postJobs(port, jobs);
    }

    if (activeJobId === job.id) {
      activeJobId = null;
      processNextJob(port, jobs);
    }
  }
}

function cancelNoteJob(port, jobs, id) {
  const job = jobs.get(id);
  if (!job || TERMINAL_STATUSES.has(job.status)) {
    return;
  }

  if (job.status === "queued") {
    job.cancelled = true;
    job.controller?.abort();
    setJobStatus(port, jobs, id, "cancelled", "Stopped before starting.");
    processNextJob(port, jobs);
    return;
  }

  if (job.status === "saving") {
    setJobStatus(port, jobs, id, "saving", "Already saving to Obsidian.");
    return;
  }

  job.cancelled = true;
  job.controller?.abort();
  setJobStatus(port, jobs, id, "cancelling", "Stopping this note.");
}

function removeNoteJob(port, jobs, id) {
  const job = jobs.get(id);
  if (!job) {
    return;
  }

  if (!TERMINAL_STATUSES.has(job.status)) {
    job.cancelled = true;
    job.controller?.abort();
  }

  jobs.delete(id);
  syncJobs(port, jobs);
  processNextJob(port, jobs);
}

function clearFinishedNoteJobs(port, jobs) {
  for (const [id, job] of jobs.entries()) {
    if (TERMINAL_STATUSES.has(job.status)) {
      jobs.delete(id);
    }
  }

  syncJobs(port, jobs);
}

function setJobStatus(port, jobs, id, status, message, updates = {}) {
  const job = jobs.get(id);
  if (!job) {
    return;
  }

  Object.assign(job, updates, {
    status,
    message,
    updatedAt: Date.now()
  });
  syncJobs(port, jobs);
}

function syncJobs(port, jobs) {
  postJobs(port, jobs);
  persistJobs(jobs);
}

function postJobs(port, jobs) {
  const ports = noteJobPorts.size ? Array.from(noteJobPorts) : [port];
  for (const targetPort of ports) {
    try {
      targetPort.postMessage({
        action: "noteJobsUpdated",
        jobs: Array.from(jobs.values()).map(toJobResponse)
      });
    } catch {
      noteJobPorts.delete(targetPort);
    }
  }
}

async function restoreStoredJobs() {
  const stored = await chrome.storage.local.get(JOB_STORAGE_KEY);
  const storedJobs = Array.isArray(stored[JOB_STORAGE_KEY]) ? stored[JOB_STORAGE_KEY] : [];

  for (const storedJob of storedJobs) {
    const status = RESUMABLE_STATUSES.has(storedJob.status) ? "queued" : storedJob.status;
    const message = RESUMABLE_STATUSES.has(storedJob.status)
      ? "Restored after reopening the extension."
      : storedJob.message || "";

    noteJobs.set(storedJob.id, {
      ...storedJob,
      status,
      message,
      updatedAt: Date.now(),
      cancelled: false,
      controller: new AbortController()
    });
  }

  jobsLoaded = true;
}

function persistJobs(jobs) {
  if (!jobsLoaded) {
    return;
  }

  chrome.storage.local.set({
    [JOB_STORAGE_KEY]: Array.from(jobs.values()).map(toStoredJob)
  });
}

function toStoredJob(job) {
  return {
    id: job.id,
    title: job.title,
    folder: job.folder,
    sourceText: TERMINAL_STATUSES.has(job.status) ? "" : job.sourceText,
    status: job.status,
    message: job.message,
    path: job.path,
    markdown: job.markdown,
    error: job.error,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt
  };
}

function toJobResponse(job) {
  return {
    id: job.id,
    title: job.title,
    folder: job.folder,
    status: job.status,
    message: job.message,
    path: job.path,
    markdown: job.markdown,
    error: job.error,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt
  };
}

async function checkLlmStatus() {
  const response = await fetch(getLmStudioModelsUrl(), { method: "GET" });

  if (!response.ok) {
    throw new Error(`LM Studio status request failed: ${response.status}`);
  }

  const data = await response.json();
  const models = Array.isArray(data?.data) ? data.data : [];
  const modelNames = models.map((model) => model.id).filter(Boolean);
  const configuredModel = CONFIG.lmStudioModel;
  const modelName = modelNames.includes(configuredModel)
    ? configuredModel
    : modelNames[0] || configuredModel;

  return {
    ok: true,
    loaded: modelNames.length > 0,
    modelName,
    models: modelNames
  };
}

async function generateMarkdown(title, sourceText, signal) {
  const response = await fetch(CONFIG.lmStudioUrl, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: CONFIG.lmStudioModel,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt()
        },
        {
          role: "user",
          content: buildUserPrompt(title, sourceText)
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`LM Studio request failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("LM Studio returned an empty response.");
  }

  return normalizeMarkdownTitle(content, title);
}

function getLmStudioModelsUrl() {
  return CONFIG.lmStudioUrl.replace(/\/chat\/completions\/?$/, "/models");
}

function buildSystemPrompt() {
  return [
    "Jesteś ekspertem od tworzenia notatek do Obsidiana. Bardzo ci zależy żeby wytłumaczyć temat jak najlepiej.",
    "Twoim zadaniem NIE jest streszczenie tekstu.",
    "Masz zamienić materiał źródłowy w praktyczną notatkę edukacyjną, która pomaga zrozumieć temat i wykorzystać go później.",
    "Pisz po polsku.",
    "Nie kopiuj zdań z materiału.",
    "Nie twórz streszczenia rozdział po rozdziale.",
    "Łącz podobne informacje.",
    "Wyjaśniaj mechanizmy.",
    "Pisz jak mentor tłumaczący temat inteligentnej osobie.",
    "Skupiaj się na modelach myślowych, decyzjach i praktyce.",
    "Jeżeli materiał jest o biznesie, startupach, AI, sprzedaży lub fundraisingu, szczególnie podkreśl sposób myślenia ekspertów, sygnały decyzyjne, błędy początkujących i praktyczne wykorzystanie.",
    "Notatka ma być użyteczna za 6 miesięcy, nie tylko dzisiaj.",
    "Jeśli materiał dotyczy rzeczy technicznych, kodowania, programowania albo podobnych tematów, tłumacz tekst jak najbardziej po ludzku, ale zachowaj techniczne wyrażenia.",
    "Podkreśl zastosowanie materiału w praktyce.",
    "Dodaj sensowne linki Obsidian wiki dla powiązanych pojęć, na przykład [[AI]], [[Sprzedaż]], [[Pipeline]], [[CRM]].",
    "Nie linkuj każdego słowa.",
    "Return only Markdown."
  ].join("\n");
}

function buildUserPrompt(title, sourceText) {
  return [
    `Title: ${title}`,
    "",
    "Użyj tej struktury Markdown:",
    "",
    `# ${title}`,
    "",
    "Krótkie 1-2 zdaniowe wyjaśnienie czym jest temat i dlaczego jest ważny.",
    "",
    "## Główna idea",
    "",
    "Wyjaśnij jedną najważniejszą myśl autora własnymi słowami.",
    "",
    "## Jak działa ten mechanizm",
    "",
    "Opisz logikę stojącą za tematem. Nie przepisuj treści. Wytłumacz dlaczego to działa.",
    "",
    "## Jak myśli ekspert",
    "",
    "Przedstaw sposób myślenia osoby, która naprawdę rozumie temat.",
    "",
    "- Jakie sygnały zauważa?",
    "- Jak ocenia sytuację?",
    "- Jakie błędy popełniają początkujący?",
    "",
    "## Co ma znaczenie w praktyce",
    "",
    "Zamień teorię na konkretne działania.",
    "",
    "- co robić",
    "- czego unikać",
    "- na co zwracać uwagę",
    "",
    "## Framework",
    "",
    "Jeżeli w materiale istnieje proces, model, strategia lub metoda działania, opisz ją jako prosty framework krok po kroku. Jeśli nie istnieje, pomiń tę sekcję.",
    "",
    "## Najważniejsze wnioski",
    "",
    "5-10 najważniejszych rzeczy, które warto zapamiętać.",
    "",
    "## Powiązane pojęcia",
    "",
    "- [[...]]",
    "- [[...]]",
    "- [[...]]",
    "",
    "## Moje zastosowanie",
    "",
    "Jak mogę wykorzystać to w mojej pracy?",
    "",
    "Podaj konkretne przykłady zastosowania.",
    "",
    "Source text:",
    sourceText
  ].join("\n");
}

function normalizeMarkdownTitle(markdown, title) {
  const trimmed = markdown.trim();
  if (trimmed.startsWith("# ")) {
    return trimmed;
  }

  return `# ${title}\n\n${trimmed}`;
}

function listFolders() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendNativeMessage(
      CONFIG.nativeHostName,
      { action: "listFolders" },
      (response) => {
        const error = chrome.runtime.lastError;

        if (error) {
          reject(new Error(error.message));
          return;
        }

        if (!response?.ok) {
          reject(new Error(response?.error || "Native host failed."));
          return;
        }

        resolve(response);
      }
    );
  });
}

function saveMarkdown(title, folder, markdown) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendNativeMessage(
      CONFIG.nativeHostName,
      { action: "saveNote", title, folder, markdown },
      (response) => {
        const error = chrome.runtime.lastError;

        if (error) {
          reject(new Error(error.message));
          return;
        }

        if (!response?.ok) {
          reject(new Error(response?.error || "Native host failed."));
          return;
        }

        resolve(response);
      }
    );
  });
}
