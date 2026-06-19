import { CONFIG } from "./config.js";

const llmStatus = document.querySelector("#llmStatus");
const monitorStatus = document.querySelector("#monitorStatus");
const clearFinishedButton = document.querySelector("#clearFinishedButton");
const queueEmpty = document.querySelector("#queueEmpty");
const queueList = document.querySelector("#queueList");

const JOB_STORAGE_KEY = "noteJobs";
const PROCESSOR_ID = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
const HEARTBEAT_INTERVAL_MS = 5000;
const STALE_PROCESS_MS = 20000;
const ACTIVE_STATUSES = new Set(["queued", "generating", "saving", "cancelling"]);
const PROCESSING_STATUSES = new Set(["generating", "saving", "cancelling"]);
const CANCELABLE_STATUSES = new Set(["queued", "generating"]);
const TERMINAL_STATUSES = new Set(["saved", "error", "cancelled"]);
const STATUS_LABELS = {
  queued: "Queued",
  generating: "Generating",
  saving: "Saving",
  saved: "Saved",
  error: "Error",
  cancelling: "Stopping",
  cancelled: "Stopped"
};

let noteJobs = [];
let activeJobId = "";
let activeController = null;
let heartbeatTimer = null;
let processing = false;

function setLlmStatus(message, statusClass) {
  llmStatus.textContent = message;
  llmStatus.className = `statusBadge ${statusClass}`;
}

function setMonitorStatus(message) {
  monitorStatus.textContent = message;
}

async function checkLlmStatus() {
  setLlmStatus("LLM: checking...", "statusChecking");

  try {
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

    if (!modelNames.length) {
      setLlmStatus("LLM: connected, no loaded model", "statusChecking");
      return;
    }

    setLlmStatus(`LLM: ready - ${modelName}`, "statusReady");
  } catch (error) {
    setLlmStatus(`LLM: not connected - ${error.message}`, "statusError");
  }
}

async function loadStoredJobs() {
  noteJobs = await getStoredJobs();
  renderJobList();
}

async function getStoredJobs() {
  const stored = await chrome.storage.local.get(JOB_STORAGE_KEY);
  return Array.isArray(stored[JOB_STORAGE_KEY]) ? stored[JOB_STORAGE_KEY] : [];
}

async function saveStoredJobs(jobs) {
  noteJobs = jobs;
  renderJobList();
  await chrome.storage.local.set({ [JOB_STORAGE_KEY]: jobs });
}

async function updateStoredJob(id, updater) {
  const jobs = await getStoredJobs();
  const nextJobs = jobs.map((job) => (job.id === id ? updater(job) : job));
  await saveStoredJobs(nextJobs);
}

async function resetStaleJobs() {
  const now = Date.now();
  const jobs = await getStoredJobs();
  let changed = false;

  const nextJobs = jobs.map((job) => {
    if (!PROCESSING_STATUSES.has(job.status)) {
      return job;
    }

    const heartbeatAt = Number(job.heartbeatAt || 0);
    if (heartbeatAt && now - heartbeatAt < STALE_PROCESS_MS) {
      return job;
    }

    changed = true;
    return {
      ...job,
      status: "queued",
      message: "Restored after monitor reopened.",
      processorId: "",
      heartbeatAt: 0,
      updatedAt: now
    };
  });

  if (changed) {
    await saveStoredJobs(nextJobs);
  }
}

function renderJobList() {
  queueList.textContent = "";
  queueEmpty.hidden = noteJobs.length > 0;
  clearFinishedButton.disabled = !noteJobs.some(isFinishedJob);

  for (const job of noteJobs) {
    queueList.append(createJobElement(job));
  }
}

function createJobElement(job) {
  const item = document.createElement("article");
  item.className = "jobItem";

  const header = document.createElement("div");
  header.className = "jobHeader";

  const title = document.createElement("h3");
  title.className = "jobTitle";
  title.textContent = job.title || "Untitled note";

  const status = document.createElement("span");
  status.className = `jobStatus jobStatus${capitalize(job.status)}`;
  status.textContent = STATUS_LABELS[job.status] || job.status;

  header.append(title, status);
  item.append(header);

  const meta = document.createElement("p");
  meta.className = "jobMeta";
  meta.textContent = `${job.folder || "Vault root"} - ${job.message || ""}`;
  item.append(meta);

  if (job.path) {
    const path = document.createElement("p");
    path.className = "jobPath";
    path.textContent = job.path;
    item.append(path);
  }

  if (job.error) {
    const error = document.createElement("p");
    error.className = "jobError";
    error.textContent = job.error;
    item.append(error);
  }

  const actions = document.createElement("div");
  actions.className = "jobActions";

  if (isCancelableJob(job)) {
    actions.append(createJobButton("Stop", "cancel", job.id, "dangerButton"));
  }

  if (job.markdown) {
    actions.append(createJobButton("Copy", "copy", job.id, "secondaryButton"));
  }

  actions.append(createJobButton("Remove", "remove", job.id, "secondaryButton"));
  item.append(actions);

  return item;
}

function createJobButton(label, action, id, className) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.dataset.action = action;
  button.dataset.id = id;
  button.textContent = label;
  return button;
}

function isActiveJob(job) {
  return ACTIVE_STATUSES.has(job.status);
}

function isFinishedJob(job) {
  return !isActiveJob(job);
}

function isCancelableJob(job) {
  return CANCELABLE_STATUSES.has(job.status);
}

function capitalize(value) {
  if (!value) {
    return "";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function hasFreshForeignProcessor() {
  const now = Date.now();
  return noteJobs.some((job) => (
    PROCESSING_STATUSES.has(job.status)
    && job.processorId
    && job.processorId !== PROCESSOR_ID
    && now - Number(job.heartbeatAt || 0) < STALE_PROCESS_MS
  ));
}

async function processNextJob() {
  if (processing || hasFreshForeignProcessor()) {
    return;
  }

  const jobs = await getStoredJobs();
  noteJobs = jobs;
  const nextJob = jobs.find((job) => job.status === "queued");

  if (!nextJob) {
    setMonitorStatus("No active job. Add notes from the extension popup.");
    renderJobList();
    return;
  }

  await runJob(nextJob);
}

async function runJob(job) {
  processing = true;
  activeJobId = job.id;
  activeController = new AbortController();
  startHeartbeat();

  try {
    if (!job.sourceText) {
      throw new Error("Source text is missing. Add this note again from the page or clipboard.");
    }

    await updateStoredJob(job.id, (current) => ({
      ...current,
      status: "generating",
      message: "Generating note with LM Studio.",
      processorId: PROCESSOR_ID,
      heartbeatAt: Date.now(),
      error: "",
      updatedAt: Date.now()
    }));
    setMonitorStatus(`Generating: ${job.title}`);

    const markdown = await generateMarkdown(job.title, job.sourceText, activeController.signal);
    await ensureJobStillActive(job.id);

    await updateStoredJob(job.id, (current) => ({
      ...current,
      status: "saving",
      message: "Saving note to Obsidian.",
      heartbeatAt: Date.now(),
      updatedAt: Date.now()
    }));
    setMonitorStatus(`Saving: ${job.title}`);

    const saved = await saveMarkdown(job.title, job.folder, markdown);
    await updateStoredJob(job.id, (current) => ({
      ...current,
      sourceText: "",
      status: "saved",
      message: "Saved to Obsidian.",
      path: saved.path,
      markdown,
      error: "",
      processorId: "",
      heartbeatAt: 0,
      updatedAt: Date.now()
    }));
    setMonitorStatus(`Saved: ${job.title}`);
  } catch (error) {
    const latestJob = (await getStoredJobs()).find((item) => item.id === job.id);
    if (!latestJob) {
      return;
    }

    if (error.name === "AbortError" || latestJob.status === "cancelled") {
      await updateStoredJob(job.id, (current) => ({
        ...current,
        status: "cancelled",
        message: "Stopped before saving.",
        processorId: "",
        heartbeatAt: 0,
        updatedAt: Date.now()
      }));
      setMonitorStatus(`Stopped: ${job.title}`);
      return;
    }

    await updateStoredJob(job.id, (current) => ({
      ...current,
      status: "error",
      message: "Could not create this note.",
      error: error.message || String(error),
      processorId: "",
      heartbeatAt: 0,
      updatedAt: Date.now()
    }));
    setMonitorStatus(`Error: ${job.title}`);
  } finally {
    stopHeartbeat();
    activeController = null;
    activeJobId = "";
    processing = false;
    processNextJob();
  }
}

async function ensureJobStillActive(id) {
  const latestJob = (await getStoredJobs()).find((job) => job.id === id);
  if (!latestJob || latestJob.status === "cancelled" || latestJob.processorId !== PROCESSOR_ID) {
    throw new DOMException("Note generation was stopped.", "AbortError");
  }
}

function startHeartbeat() {
  stopHeartbeat();
  heartbeatTimer = setInterval(() => {
    if (!activeJobId) {
      return;
    }

    updateStoredJob(activeJobId, (job) => ({
      ...job,
      heartbeatAt: Date.now()
    }));
  }, HEARTBEAT_INTERVAL_MS);
}

function stopHeartbeat() {
  if (!heartbeatTimer) {
    return;
  }

  clearInterval(heartbeatTimer);
  heartbeatTimer = null;
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

function getLmStudioModelsUrl() {
  return CONFIG.lmStudioUrl.replace(/\/chat\/completions\/?$/, "/models");
}

function buildSystemPrompt() {
  return [
    "You turn copied source text into clean Obsidian Markdown notes.",
    "The goal is not to summarize text nicely. The goal is to create a reusable knowledge note.",
    "Write in the same language as the source text.",
    "Use a practical, clear, human tone with short paragraphs.",
    "Do not sound academic. Do not add filler or generic advice.",
    "Do not copy the source text verbatim.",
    "Transform the source into practical understanding, mental models, and useful future reference.",
    "Prefer clear mental models over long explanations.",
    "Use bullets when they improve scanning.",
    "Use tables only when they make comparison or process clearer.",
    "Remove unnecessary details and anything that future me will not use.",
    "Add Obsidian wiki links for key terms, for example [[HTTP]], [[URL]], [[Cookies]], [[Headers]], [[curl]].",
    "Use specific links when obvious, but do not over-link every word.",
    "Return only Markdown."
  ].join("\n");
}

function buildUserPrompt(title, sourceText) {
  return [
    `Title: ${title}`,
    "",
    "Use exactly this Markdown structure:",
    "",
    `# ${title}`,
    "",
    "## Główna idea",
    "",
    "One clear idea in plain language.",
    "",
    "## Co muszę zrozumieć",
    "",
    "The core concepts, broken into small chunks.",
    "",
    "## Jak o tym myśleć",
    "",
    "Mental model, comparison, frame, or decision logic.",
    "",
    "## Przydatne w praktyce",
    "",
    "How to use this knowledge in real work.",
    "",
    "## Najważniejsze wnioski",
    "",
    "Short bullet list of what matters most.",
    "",
    "## Powiązane pojęcia",
    "",
    "- [[Key Concept]]",
    "- [[Another Concept]]",
    "",
    "Optional sections:",
    "- Add ## Komendy only if the source includes commands, CLI usage, code snippets, or technical steps.",
    "- Add ## Proces only if the source describes a workflow.",
    "- Add ## Checklist only if the note should guide repeated action.",
    "- Add ## Przykład only if one simple example makes the idea easier to remember.",
    "- Add ## Pułapki only if the source warns about mistakes or false assumptions.",
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

queueList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action][data-id]");
  if (!button) {
    return;
  }

  const { action, id } = button.dataset;

  if (action === "cancel") {
    await updateStoredJob(id, (job) => ({
      ...job,
      status: "cancelled",
      message: "Stopped by user.",
      processorId: "",
      heartbeatAt: 0,
      updatedAt: Date.now()
    }));

    if (activeJobId === id) {
      activeController?.abort();
    }
    return;
  }

  if (action === "remove") {
    const jobs = await getStoredJobs();
    await saveStoredJobs(jobs.filter((job) => job.id !== id));

    if (activeJobId === id) {
      activeController?.abort();
    }
    return;
  }

  if (action === "copy") {
    const job = noteJobs.find((item) => item.id === id);
    if (job?.markdown) {
      await navigator.clipboard.writeText(job.markdown);
      setMonitorStatus(`Copied: ${job.title}`);
    }
  }
});

clearFinishedButton.addEventListener("click", () => {
  saveStoredJobs(noteJobs.filter((job) => !TERMINAL_STATUSES.has(job.status)));
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes[JOB_STORAGE_KEY]) {
    return;
  }

  noteJobs = Array.isArray(changes[JOB_STORAGE_KEY].newValue)
    ? changes[JOB_STORAGE_KEY].newValue
    : [];
  renderJobList();

  const activeJob = activeJobId ? noteJobs.find((job) => job.id === activeJobId) : null;
  if (activeJobId && (!activeJob || activeJob.status === "cancelled")) {
    activeController?.abort();
  }

  processNextJob();
});

window.addEventListener("beforeunload", () => {
  activeController?.abort();
  stopHeartbeat();
});

await loadStoredJobs();
await resetStaleJobs();
await checkLlmStatus();
processNextJob();
