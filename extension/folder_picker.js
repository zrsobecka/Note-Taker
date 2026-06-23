const SELECTED_FOLDER_STORAGE_KEY = "selectedSaveFolderPath";
const statusText = document.querySelector("#statusText");
const retryButton = document.querySelector("#retryButton");

function setStatus(message) {
  statusText.textContent = message;
}

async function chooseFolder() {
  retryButton.hidden = true;
  setStatus("Opening folder picker...");

  try {
    const response = await chrome.runtime.sendMessage({ action: "chooseFolder" });
    if (!response?.ok) {
      throw new Error(response?.error || "Could not choose folder.");
    }

    if (response.cancelled) {
      setStatus("Folder selection cancelled.");
      retryButton.hidden = false;
      return;
    }

    if (!response.folderPath) {
      setStatus("Choose a local save folder.");
      retryButton.hidden = false;
      return;
    }

    await chrome.storage.local.set({ [SELECTED_FOLDER_STORAGE_KEY]: response.folderPath });
    setStatus(`Selected: ${response.folderPath}`);
    setTimeout(() => window.close(), 700);
  } catch (error) {
    setStatus(`Folder picker error: ${error.message}`);
    retryButton.hidden = false;
  }
}

retryButton.addEventListener("click", () => {
  chooseFolder();
});

chooseFolder();
