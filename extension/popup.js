import { CONFIG } from "./config.js";

const titleInput = document.querySelector("#titleInput");
const folderInput = document.querySelector("#folderInput");
const saveButton = document.querySelector("#saveButton");
const copyButton = document.querySelector("#copyButton");
const resultBox = document.querySelector("#resultBox");
const resultText = document.querySelector("#resultText");
const sourceStatus = document.querySelector("#sourceStatus");
const llmStatus = document.querySelector("#llmStatus");

let sourceText = "";
let latestMarkdown = "";

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function getSelectedText() {
  const tab = await getActiveTab();
  if (!tab?.id) {
    return "";
  }

  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => window.getSelection()?.toString() || ""
  });

  return result?.result?.trim() || "";
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

  setStatus("No selected or copied text found.");
}

async function sendToServiceWorker(message) {
  return await chrome.runtime.sendMessage(message);
}

saveButton.addEventListener("click", async () => {
  const title = titleInput.value.trim();
  const folder = folderInput.value;

  if (!sourceText) {
    await loadSourceText();
  }

  if (!sourceText) {
    showResult("Select text on the page or copy text first.");
    return;
  }

  if (!title) {
    titleInput.focus();
    showResult("Add a note title first.");
    return;
  }

  if (!folder) {
    folderInput.focus();
    showResult("Choose a folder first.");
    return;
  }

  saveButton.disabled = true;
  saveButton.textContent = "Generating...";
  showResult("Generating note with LM Studio...");

  try {
    const response = await sendToServiceWorker({
      action: "generateAndSaveNote",
      payload: {
        title,
        folder,
        sourceText
      }
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Unknown error");
    }

    latestMarkdown = response.markdown;
    showResult(`Saved:\n${response.path}\n\n${response.markdown}`);
  } catch (error) {
    showResult(`Error: ${error.message}`);
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = "Generate note";
  }
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

loadFolders();
loadSourceText();
checkLlmStatus();
