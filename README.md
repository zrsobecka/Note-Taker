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

## Recommended Setup: Local LLM + Obsidian Workflow

This extension was designed to work with local language models running through LM Studio.

My personal workflow:

1. Read an article, course lesson, PDF, or webpage.
2. Select the most relevant content (or use full page mode).
3. Send it to Note Taker.
4. Note Taker sends the content to a local model running in LM Studio.
5. The model transforms raw text into a structured Obsidian note.
6. The note is automatically saved into the correct folder inside my Obsidian vault.

### Model Used

I currently use:

```text
Qwen3 30B A3B Thinking 2507
```

running locally through LM Studio.

Any OpenAI-compatible model exposed by LM Studio can be used, but larger reasoning models generally produce better summaries, explanations, and knowledge extraction.

### Why Use a Local LLM?

Using a local model provides several advantages:

- No API costs.
- Notes are generated entirely on your own machine.
- Source material never leaves your computer.
- Faster iteration when processing large amounts of learning material.
- Full control over prompts and note-generation rules.

### How the Model Affects Note Quality

The generated notes are heavily influenced by the model you choose.

Smaller models typically:

- summarize aggressively;
- miss important context;
- produce shorter notes;
- simplify complex topics.

Stronger reasoning models typically:

- preserve more information;
- explain concepts in clearer language;
- identify important frameworks and mental models;
- connect ideas instead of only summarizing them;
- produce notes that are more useful for long-term learning.

For educational content, startup research, business material, and technical documentation, a strong reasoning model can dramatically improve note quality.

### Note Generation Philosophy

The goal is not to create short summaries.

The goal is to transform source material into reusable knowledge.

A good note should help you:

- understand the topic;
- remember the important concepts;
- connect ideas inside Obsidian;
- apply what you learned later.

The note-generation rules can be customized in:

```text
docs/note-generation-rules.md
```

This allows you to adapt the output for research, learning, technical documentation, startup analysis, personal knowledge management, or any other workflow.
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
