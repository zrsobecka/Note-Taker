# Codebase

This repository contains a local Chrome extension plus a Python Native Messaging host. The extension collects browser text, sends it to a local LM Studio model, and asks the native host to save the generated Markdown into a selected local folder. That folder can be an Obsidian vault, but Obsidian is optional.

## Directory Map

| Path | Purpose |
|---|---|
| `extension/manifest.json` | Chrome extension metadata, permissions, host permissions, popup, and service worker registration. |
| `extension/config.js` | Local LM Studio endpoint, default model, native host name, and source size limit. |
| `extension/popup.html` / `popup.css` / `popup.js` | Compact capture UI for title, save folder, language, model, source mode, and queue actions. |
| `extension/folder_picker.html` / `folder_picker.css` / `folder_picker.js` | Durable extension window that opens the native folder picker and stores the selected local folder path. |
| `extension/queue.html` / `queue.css` / `queue.js` | Queue monitor UI and processing loop. Sends requests to LM Studio and saves notes through Native Messaging. |
| `extension/service_worker.js` | Background logic for source extraction, queue helpers, model/folder loading, and prompt construction. |
| `extension/icons/` | Chrome extension icons. |
| `native-host/chrome_note_clipper_host.py` | Native Messaging host. Reads messages, opens the local folder picker, resolves save folders, writes Markdown files, and logs local events. |
| `native-host/install_native_host.py` | Windows installer for the Chrome Native Messaging manifest and registry key. |
| `native-host/config.example.json` | Safe example for local save-folder settings. Copy to ignored `config.json`. |
| `scripts/install_extension.ps1` / `install.ps1` | PowerShell installers for local config, Native Messaging registration, and Chrome extension setup guidance. |
| `native-host/chrome_note_clipper_host.example.json` | Safe example Native Messaging manifest. The installer copies this to an ignored local manifest. |
| `docs/note-generation-rules.md` | Human-readable prompt rules for generated notes. |
| `docs/chrome-note-clipper-design.md` | Product and architecture overview. |
| `tools/generate_extension_icons.py` | Utility script for regenerating extension icon assets. |

## Runtime Contracts

- Native host name: `com.note_taker.chrome_note_clipper`.
- LM Studio chat endpoint: `http://localhost:1234/v1/chat/completions`.
- LM Studio model endpoint: `http://localhost:1234/v1/models`.
- Native host actions: `listFolders` (legacy/optional), `chooseFolder`, and `saveNote`.
- Local config path: `native-host/config.json`.
- Local native manifest path: `native-host/chrome_note_clipper_host.json`.
- Local log path: `native-host/native-host.log`.

These names are part of the local integration contract. Do not rename them without updating Chrome registration, extension config, docs, and tests together.

## Data Handling

The extension can read selected text, clipboard text, or full page text depending on the chosen capture mode. Source text is sent to the configured LM Studio endpoint. In the default setup that endpoint is local.

The native host writes to the selected local save folder passed as `folderPath`, or to `default_save_folder` when no job folder path is provided. Legacy `vault_path` plus relative `folder` support remains for older local setups.

Ignored local files may contain personal paths or extension IDs and must not be committed:

- `native-host/config.json`
- `native-host/chrome_note_clipper_host.json`
- `native-host/native-host.log`

## Development Notes

When changing note behavior, keep these files aligned:

- `docs/note-generation-rules.md`
- `extension/queue.js`
- `extension/service_worker.js`

When changing Chrome permissions or host permissions, update `README.md` so outside readers can understand why each permission is needed.

## Verification

```powershell
node --check extension\popup.js
node --check extension\folder_picker.js
node --check extension\queue.js
node --check extension\service_worker.js
python -m py_compile native-host\install_native_host.py native-host\chrome_note_clipper_host.py
python -m unittest native-host\test_folder_selection.py
```
