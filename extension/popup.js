import { CONFIG } from "./config.js";

const titleInput = document.querySelector("#titleInput");
const folderInput = document.querySelector("#folderInput");
const saveButton = document.querySelector("#saveButton");
const copyButton = document.querySelector("#copyButton");
const resultBox = document.querySelector("#resultBox");
const resultText = document.querySelector("#resultText");
const sourceStatus = document.querySelector("#sourceStatus");
const llmStatus = document.querySelector("#llmStatus");
const clearFinishedButton = document.querySelector("#clearFinishedButton");
const openMonitorButton = document.querySelector("#openMonitorButton");
const queueEmpty = document.querySelector("#queueEmpty");
const queueList = document.querySelector("#queueList");

let sourceText = "";
let latestMarkdown = "";
let noteJobs = [];

const ACTIVE_STATUSES = new Set(["queued", "generating", "saving", "cancelling"]);
const CANCELABLE_STATUSES = new Set(["queued", "generating"]);
const JOB_STORAGE_KEY = "noteJobs";
const STATUS_LABELS = {
  queued: "Queued",
  generating: "Generating",
  saving: "Saving",
  saved: "Saved",
  error: "Error",
  cancelling: "Stopping",
  cancelled: "Stopped"
};

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function getSelectedText() {
  const tab = await getActiveTab();
  if (!tab?.id) {
    return "";
  }

  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection()?.toString() || ""
    });

    return result?.result?.trim() || "";
  } catch (error) {
    console.warn("Could not read selected page text.", error);
    return "";
  }
}

async function getClipboardText() {
  try {
    return (await navigator.clipboard.readText()).trim();
  } catch {
    return "";
  }
}

function setStatus(message) {
  sourceStatus.textContent = message;
}

function showResult(message) {
  resultBox.hidden = false;
  resultText.textContent = message;
}

function setLlmStatus(message, statusClass) {
  llmStatus.textContent = message;
  llmStatus.className = `statusBadge ${statusClass}`;
}

async function checkLlmStatus() {
  setLlmStatus("LLM: checking...", "statusChecking");

  try {
    const response = await sendToServiceWorker({ action: "checkLlmStatus" });
    if (!response?.ok) {
      throw new Error(response?.error || "LM Studio is not responding.");
    }

    if (!response.loaded) {
      setLlmStatus("LLM: connected, no loaded model", "statusChecking");
      return;
    }

    setLlmStatus(`LLM: ready - ${response.modelName}`, "statusReady");
  } catch (error) {
    setLlmStatus(`LLM: not connected - ${error.message}`, "statusError");
  }
}

function fillFolderOptions(folders) {
  folderInput.textContent = "";

  const uniqueFolders = Array.from(new Set(folders || []));

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = uniqueFolders.length ? "Choose folder..." : "No folders found";
  placeholder.disabled = true;
  placeholder.selected = true;
  folderInput.append(placeholder);

  for (const folder of uniqueFolders) {
    const option = document.createElement("option");
    option.value = folder;
    option.textContent = folder;
    folderInput.append(option);
  }
}

async function loadFolders() {
  try {
    const response = await sendToServiceWorker({ action: "listFolders" });
    if (!response?.ok) {
      throw new Error(response?.error || "Could not load folders.");
    }

    fillFolderOptions(response.folders);
  } catch (error) {
    fillFolderOptions([]);
    showResult(`Folder list error: ${error.message}`);
  }
}

async function loadSourceText() {
  const selected = await getSelectedText();
  const clipboard = selected ? "" : await getClipboardText();
  sourceText = (selected || clipboard).slice(0, CONFIG.maxSourceCharacters);

  if (selected) {
    setStatus(`Using selected page text (${selected.length} characters).`);
    return;
  }

  if (clipboard) {
    setStatus(`Using clipboard text (${clipboard.length} characters).`);
    return;
  }

  setStatus("No selected or copied text found. If the page blocks selection access, copy the text and try again.");
}

async function sendToServiceWorker(message) {
  return await chrome.runtime.sendMessage(message);
}

function createJobId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

function capitalize(value) {
  if (!value) {
    return "";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

async function loadStoredJobs() {
  const stored = await chrome.storage.local.get(JOB_STORAGE_KEY);
  noteJobs = Array.isArray(stored[JOB_STORAGE_KEY]) ? stored[JOB_STORAGE_KEY] : [];
  renderJobList();
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

async function getStoredJobs() {
  const stored = await chrome.storage.local.get(JOB_STORAGE_KEY);
  return Array.isArray(stored[JOB_STORAGE_KEY]) ? stored[JOB_STORAGE_KEY] : [];
}

function openQueueMonitor() {
  const queueUrl = chrome.runtime.getURL("queue.html");
  if (!chrome.windows?.create) {
    window.open(queueUrl, "obsidian-note-queue");
    return;
  }

  chrome.windows.create({
    url: queueUrl,
    type: "popup",
    width: 540,
    height: 760,
    focused: true
  }, () => {
    if (chrome.runtime.lastError) {
      window.open(queueUrl, "obsidian-note-queue");
    }
  });
}

saveButton.addEventListener("click", async () => {
  const title = titleInput.value.trim();
  const folder = folderInput.value;

  saveButton.disabled = true;
  saveButton.textContent = "Adding...";

  await loadSourceText();

  if (!sourceText) {
    showResult("Select text on the page or copy text first.");
    saveButton.disabled = false;
    saveButton.textContent = "Add to queue";
    return;
  }

  if (!title) {
    titleInput.focus();
    showResult("Add a note title first.");
    saveButton.disabled = false;
    saveButton.textContent = "Add to queue";
    return;
  }

  if (!folder) {
    folderInput.focus();
    showResult("Choose a folder first.");
    saveButton.disabled = false;
    saveButton.textContent = "Add to queue";
    return;
  }

  const jobs = await getStoredJobs();
  await saveStoredJobs([
    ...jobs,
    {
      id: createJobId(),
      title,
      folder,
      sourceText,
      status: "queued",
      message: "Waiting for queue monitor.",
      path: "",
      markdown: "",
      error: "",
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ]);

  openQueueMonitor();
  showResult(`Added to queue: ${title}. Keep the monitor window open while it generates.`);
  saveButton.disabled = false;
  saveButton.textContent = "Add to queue";
});

copyButton.addEventListener("click", async () => {
  if (!latestMarkdown) {
    return;
  }

  await navigator.clipboard.writeText(latestMarkdown);
  copyButton.textContent = "Copied";
  setTimeout(() => {
    copyButton.textContent = "Copy";
  }, 1200);
});

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
      updatedAt: Date.now()
    }));
    return;
  }

  if (action === "remove") {
    const jobs = await getStoredJobs();
    await saveStoredJobs(jobs.filter((job) => job.id !== id));
    return;
  }

  if (action === "copy") {
    const job = noteJobs.find((item) => item.id === id);
    if (!job?.markdown) {
      return;
    }

    latestMarkdown = job.markdown;
    await navigator.clipboard.writeText(job.markdown);
    showResult(`Copied note: ${job.title}`);
  }
});

clearFinishedButton.addEventListener("click", () => {
  saveStoredJobs(noteJobs.filter((job) => !isFinishedJob(job)));
});

openMonitorButton.addEventListener("click", () => {
  openQueueMonitor();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes[JOB_STORAGE_KEY]) {
    return;
  }

  noteJobs = Array.isArray(changes[JOB_STORAGE_KEY].newValue)
    ? changes[JOB_STORAGE_KEY].newValue
    : [];
  renderJobList();
});

loadStoredJobs();
loadFolders();
loadSourceText();
checkLlmStatus();
