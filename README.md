# Note Taker

Local Windows Chrome extension for turning browser content into clean Obsidian Markdown notes with LM Studio.

## Components

- `extension/` - Chrome popup, queue monitor, LM Studio integration.
- `native-host/` - Python Native Messaging host that saves `.md` files to an Obsidian vault.
- `docs/` - product notes and note-generation rules.

## Flow

1. Choose text source: auto selection→clipboard, selected only, clipboard only, or full page text.
2. Enter title, Obsidian folder, note language, and LM Studio model.
3. Add note to queue.
4. Queue monitor sends source text to LM Studio.
5. Native host saves generated Markdown into the selected vault folder.

## Requirements

- Windows
- Google Chrome
- Python 3.10+
- LM Studio local server
- Obsidian vault

LM Studio endpoint:

```text
http://localhost:1234/v1/chat/completions
```

Model list endpoint:

```text
http://localhost:1234/v1/models
```

## Config

- `extension/config.js` - LM Studio URL, default model, native host name, source character limit.
- Copy `native-host/config.example.json` to `native-host/config.json` - local vault path and excluded folders.
- `docs/note-generation-rules.md` - generated note rules.

Local-only config is ignored by Git. Keep personal paths and Chrome extension IDs out of tracked files.

## Install

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Load unpacked and select the local `extension/` folder.
4. Copy the extension ID.
5. Register the native host:

```powershell
cd "C:\Path\To\Note Taker\native-host"
python install_native_host.py --extension-id YOUR_EXTENSION_ID
```

6. Edit local `native-host\config.json` and set `vault_path`.

The extension reads folders from this vault and uses `excluded_folders` to hide technical folders from the picker.
