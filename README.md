# Note Taker

Turn browser content into high-quality Markdown notes using a local LLM.

Note Taker is a Windows Chrome extension that captures text from a webpage, sends it to a local model running in LM Studio, and saves the generated Markdown note directly into a local folder you choose. That folder can be an Obsidian vault, but Obsidian is not required.

The important difference: this is built around local AI. Your source material can stay on your own machine, you choose the model, and no cloud API key is required.

## Why It Exists

Most AI note-taking tools follow this pattern:

```text
Website -> Cloud AI provider -> Summary -> Notes
```

That can be convenient, but it usually means your source material leaves your computer, you pay API costs, and you depend on one provider's model and product decisions.

Note Taker uses a local-first flow instead:

```text
Website -> Chrome extension -> LM Studio on localhost -> Markdown -> local notes folder
```

This gives you:

- local-first privacy for sensitive reading and research;
- no required cloud API subscription;
- control over which model generates your notes;
- direct saving into your own local notes folder;
- prompt rules you can inspect and customize.

## What Makes It Different

The core feature is the LM Studio integration.

Instead of sending browser content to OpenAI, Anthropic, or another hosted AI provider, Note Taker calls LM Studio's local OpenAI-compatible API:

```text
http://localhost:1234/v1/chat/completions
http://localhost:1234/v1/models
```

Any model exposed by LM Studio can be used, including local models from families such as Qwen, Llama, Gemma, Mistral, and DeepSeek.

Because the model runs locally:

- private source material does not need to leave your device;
- you can improve note quality by switching models;
- you are not locked into one AI provider;
- note generation can run without per-request API billing.

If you configure LM Studio or a compatible server to use a remote endpoint, that changes the privacy boundary. Review your setup before processing private material.

## What The Notes Are Like

Note Taker is designed to create reusable knowledge notes, not tiny summaries.

The prompt rules ask the model to:

- preserve important concepts, examples, frameworks, tradeoffs, and warnings;
- remove website clutter such as navigation, banners, forms, and repeated UI text;
- explain the material clearly enough that the note remains useful later;
- write in the language selected for that specific note;
- save the output as clean Markdown.

The note-generation rules live in:

```text
docs/note-generation-rules.md
```

## How It Works

1. Open a webpage.
2. Select text, copy text, or choose full-page capture.
3. Open Note Taker.
4. Enter a title, choose a local save folder, note language, and LM Studio model.
5. Add the note to the queue.
6. The queue monitor sends the source text to LM Studio.
7. The local model generates structured Markdown.
8. The native host saves the Markdown file inside your selected local notes folder.

Supported text sources:

- auto selection -> clipboard;
- selected text only;
- clipboard only;
- full page text.

## Requirements

- Windows
- Google Chrome
- Python 3.10+
- LM Studio
- At least one model downloaded in LM Studio
- Local folder for generated Markdown notes

## Before Installing

1. Install [LM Studio](https://lmstudio.ai).
2. Download a local model in LM Studio.
3. Open LM Studio's local server screen.
4. Start the local server.
5. Confirm it is running on `localhost:1234`.

Do this before using the extension, because Note Taker reads the available models from LM Studio.

## Install

1. Clone or download this repository.
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Choose **Load unpacked** and select the local `extension/` folder.
5. Copy the generated Chrome extension ID.
6. Run the PowerShell installer from the repository root:

```powershell
.\scripts\install_extension.ps1 -ExtensionId YOUR_EXTENSION_ID -DefaultSaveFolder "C:\Path\To\Your\Notes"
```

You can also run the root launcher, which opens the installer through PowerShell 7 when available:

```powershell
.\install.ps1 -ExtensionId YOUR_EXTENSION_ID -DefaultSaveFolder "C:\Path\To\Your\Notes"
```

If you have not loaded the extension yet, run:

```powershell
.\install.ps1 -OpenChromeExtensions
```

Then load the `extension/` folder in Chrome, copy the extension ID, and run the installer again with `-ExtensionId`.

The installer creates `native-host\config.json` when needed. The main setting is `default_save_folder`:

```json
{
  "default_save_folder": "C:\\Path\\To\\Your\\Notes",
  "excluded_folders": [
    "docs/superpowers"
  ],
  "filename_date_prefix": false
}
```

The native host can still save into an Obsidian vault if you choose your vault or one of its folders as the save folder.

Manual native host registration is still available:

```powershell
cd "C:\Path\To\Note Taker\native-host"
python install_native_host.py --extension-id YOUR_EXTENSION_ID
```

The installer creates a local `native-host\chrome_note_clipper_host.json` from the tracked example and registers it in the current user's Chrome Native Messaging registry key.

## Configuration

- `extension/config.js` - LM Studio URL, default model, native host name, source character limit.
- `native-host/config.example.json` - safe template for local save-folder settings.
- `native-host/chrome_note_clipper_host.example.json` - safe template for Chrome Native Messaging.
- `docs/note-generation-rules.md` - human-readable note rules.

Local-only config is ignored by Git:

- `native-host/config.json`
- `native-host/chrome_note_clipper_host.json`
- `native-host/native-host.log`

Keep real vault paths, Chrome extension IDs, API keys, tokens, and machine-specific details out of tracked files.

## Permissions And Privacy

The Chrome extension requests:

- `activeTab` and `scripting` to read selected or page text from the active tab.
- `clipboardRead` for clipboard-based capture modes.
- `nativeMessaging` to call the local Python host.
- `storage` to keep queue and UI state.
- `http://localhost:1234/*` and `http://127.0.0.1:1234/*` to call LM Studio locally.

By default:

- browser source text is sent to LM Studio on `localhost`;
- generated Markdown is written to the selected local save folder;
- queue state, selected model, selected language, and recent UI settings are stored in Chrome extension storage;
- the native host writes a local log file at `native-host/native-host.log`;
- no external AI API key is required.

## Project Structure

```text
extension/     Chrome popup, queue monitor, source extraction, LM Studio requests
native-host/   Python Native Messaging host that writes notes to a local folder
docs/          Note-generation rules and product documentation
tools/         Utility scripts
```

For a deeper file map, see `CODEBASE.md`. For the runtime flow, see `WORKFLOW-DIAGRAM.md`.

## Out Of Scope

This repository does not include:

- hosted backend services;
- built-in cloud model integrations;
- cross-browser packaging;
- Obsidian plugin code;
- sync between machines.

## Verify

JavaScript syntax checks:

```powershell
node --check extension\popup.js
node --check extension\folder_picker.js
node --check extension\queue.js
node --check extension\service_worker.js
```

Python syntax checks:

```powershell
python -m py_compile native-host\install_native_host.py native-host\chrome_note_clipper_host.py
python -m unittest native-host\test_folder_selection.py
```

## Development Notes

Until prompt construction is shared, keep note behavior aligned in:

- `docs/note-generation-rules.md`
- `extension/queue.js`
- `extension/service_worker.js`

## Licence

MIT License. See `LICENCE.md`.
