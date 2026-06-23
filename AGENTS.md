# Project Instructions

Local Windows Chrome extension for creating Markdown notes from browser content.

## Map

- `extension/`: popup, queue monitor, LM Studio requests, prompt code.
- `native-host/`: Python Native Messaging host that writes `.md` files to a selected local save folder.
- `docs/note-generation-rules.md`: human-readable note rules.
- `docs/chrome-note-clipper-design.md`: product/architecture overview.

## Safety

Never commit local machine config:

- `native-host/config.json`
- `native-host/chrome_note_clipper_host.json`

Use tracked examples. Never add real vault paths, extension IDs, private local paths, API keys, tokens, or personal machine details to tracked files.

## Installers

PowerShell launchers must work when this repo path contains spaces. For PS7 relaunch, prefer `& $pwsh.Source @arguments` over `Start-Process -ArgumentList`, especially for `-File`.

## Prompt Sync

Until prompt construction is shared, note behavior must stay aligned in:

- `docs/note-generation-rules.md`
- `extension/queue.js`
- `extension/service_worker.js`

When changing note behavior, update all three or state why not.

## UI

Keep popup/monitor dark, compact, calm, and consistent. Purple is an accent. Buttons stay dark with purple text/accent states. Avoid explanatory UI text blocks.

## Verify

JS:

```powershell
node --check extension\popup.js
node --check extension\folder_picker.js
node --check extension\queue.js
node --check extension\service_worker.js
```

Python:

```powershell
python -m py_compile native-host\install_native_host.py native-host\chrome_note_clipper_host.py
python -m unittest native-host\test_folder_selection.py
```

## Current Behavior

Text sources: auto selection→clipboard, selected only, clipboard only, full page text. Jobs store language, LM Studio model, and `folderPath`. Saves go to a chosen local folder or `default_save_folder`; Obsidian is optional.
