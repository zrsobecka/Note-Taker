# Note Taker

Local Windows Chrome extension for turning browser content into clean Obsidian Markdown notes with LM Studio.

## What It Does

Note Taker helps capture useful knowledge from browser content without sending source text to a cloud API.

1. Choose a text source: auto selection -> clipboard, selected only, clipboard only, or full page text.
2. Enter a title, Obsidian folder, note language, and LM Studio model.
3. Add the note to the queue.
4. The queue monitor sends the source text to LM Studio's local OpenAI-compatible API.
5. The native host saves the generated Markdown file into the configured Obsidian vault.

The goal is not short summaries. The prompt rules turn source material into practical Obsidian notes that explain concepts, preserve useful context, and remain useful later.

## Components

- `extension/` - Chrome popup, queue monitor, source extraction, LM Studio requests, prompt code.
- `native-host/` - Python Native Messaging host that lists vault folders and writes `.md` files.
- `docs/` - product notes and note-generation rules.

For a deeper file map, see `CODEBASE.md`. For the runtime flow, see `WORKFLOW-DIAGRAM.md`.

## Requirements

- Windows
- Google Chrome
- Python 3.10+
- LM Studio local server
- Obsidian vault

LM Studio endpoints used by the extension:

```text
http://localhost:1234/v1/chat/completions
http://localhost:1234/v1/models
```

## Install

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Choose **Load unpacked** and select the local `extension/` folder.
4. Copy the generated Chrome extension ID.
5. Copy the native host config example:

```powershell
Copy-Item native-host\config.example.json native-host\config.json
```

6. Edit `native-host\config.json` and set `vault_path` to your local Obsidian vault.
7. Register the native host:

```powershell
cd "C:\Path\To\Note Taker\native-host"
python install_native_host.py --extension-id YOUR_EXTENSION_ID
```

The installer creates a local `native-host\chrome_note_clipper_host.json` from the tracked example and registers it in the current user's Chrome Native Messaging registry key.

## Configuration

- `extension/config.js` - LM Studio URL, default model, native host name, source character limit.
- `native-host/config.example.json` - safe template for local vault settings.
- `native-host/chrome_note_clipper_host.example.json` - safe template for Chrome Native Messaging.
- `docs/note-generation-rules.md` - human-readable note rules.

Local-only config is ignored by Git:

- `native-host/config.json`
- `native-host/chrome_note_clipper_host.json`
- `native-host/native-host.log`

Keep real vault paths, Chrome extension IDs, API keys, tokens, and machine-specific details out of tracked files.

## Data And Privacy

This project is designed for a local workflow:

- Browser source text is sent to LM Studio on `localhost`.
- Generated Markdown is written to the configured local Obsidian vault.
- Queue state, selected model, selected language, and recent UI settings are stored in Chrome extension storage.
- The native host writes a local log file at `native-host/native-host.log`.

The extension does not require a cloud API key. If you point LM Studio or a compatible endpoint at a remote server, source text may leave your machine; document that choice in your own local setup before using it with private material.

## Permissions

The Chrome extension requests:

- `activeTab` and `scripting` to read selected or page text from the active tab.
- `clipboardRead` for clipboard-based capture modes.
- `nativeMessaging` to call the local Python host.
- `storage` to keep queue and UI state.
- `http://localhost:1234/*` and `http://127.0.0.1:1234/*` to call LM Studio locally.

## Out Of Scope

This repository does not include:

- A hosted backend.
- Cloud model integrations.
- Cross-browser packaging.
- Obsidian plugin code.
- Sync between machines.

## Verify

JavaScript syntax checks:

```powershell
node --check extension\popup.js
node --check extension\queue.js
node --check extension\service_worker.js
```

Python syntax checks:

```powershell
python -m py_compile native-host\install_native_host.py native-host\chrome_note_clipper_host.py
```

## Note Rules

The note-generation behavior is documented in:

```text
docs/note-generation-rules.md
```

Until prompt construction is shared, keep note behavior aligned in:

- `docs/note-generation-rules.md`
- `extension/queue.js`
- `extension/service_worker.js`
