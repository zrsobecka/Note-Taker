# Note Taker

Note Taker is a local Windows project for turning copied or selected browser text into clean Obsidian Markdown notes.

The first module is Chrome Note Clipper:

- `extension/` - Chrome extension UI and LM Studio integration.
- `native-host/` - Python native messaging host that saves `.md` files into an Obsidian vault.

## Flow

1. Select text on a web page or copy text to the clipboard.
2. Open the Chrome Note Clipper extension.
3. Enter a note title and choose an Obsidian folder.
4. The extension sends the text to LM Studio running locally.
5. The extension sends the generated Markdown to the Python native host.
6. The Python host saves the note as a `.md` file in the selected Obsidian folder.

## Requirements

- Windows
- Google Chrome
- Python 3.10+
- LM Studio with the local server enabled
- An Obsidian vault folder

## LM Studio

Start the LM Studio local server and make sure it exposes an OpenAI-compatible endpoint:

```text
http://localhost:1234/v1/chat/completions
```

The Chrome popup shows an LLM status badge:

- `LLM: ready` - LM Studio is reachable and at least one model is loaded.
- `LLM: connected, no loaded model` - the server responds, but no model is available.
- `LLM: not connected` - LM Studio is not reachable from the extension.

## Project Config

Edit these files before using the project:

- `extension/config.js`
  - LM Studio URL
  - model name
  - native host name
- `native-host/config.json`
  - Obsidian vault path
  - folders hidden from the Chrome folder picker
- `docs/note-generation-rules.md`
  - rules for Obsidian-friendly generated notes

## Load Chrome Extension

1. Open Chrome.
2. Go to `chrome://extensions`.
3. Enable Developer mode.
4. Click Load unpacked.
5. Select:

```text
C:\Users\zusob\Dropbox\Note Taker\extension
```

6. Copy the extension ID shown by Chrome.

## Install Native Host

From PowerShell, replace `YOUR_EXTENSION_ID` with the ID copied from Chrome:

```powershell
cd "C:\Users\zusob\Dropbox\Note Taker\native-host"
python install_native_host.py --extension-id YOUR_EXTENSION_ID
```

This registers the native messaging host for Chrome and allows this extension to save notes.

## Obsidian Vault

Before saving real notes, edit:

```text
C:\Users\zusob\Dropbox\Note Taker\native-host\config.json
```

Set `vault_path` to your Obsidian vault path.

The extension reads folders from this vault and asks you to choose one before saving.

Use `excluded_folders` to hide technical folders from the Chrome picker without deleting them from the vault.
