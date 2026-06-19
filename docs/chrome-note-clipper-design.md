# Obsidian Note Taker Design

Obsidian Note Taker is the first module of the Note Taker project.

## Goal

Turn browser content into a clean Obsidian Markdown note using a local LM Studio model.

## Components

- Chrome extension
  - Lets the user choose the source text mode:
    - auto: selected text first, then clipboard;
    - selected text only;
    - clipboard only;
    - full page text.
  - Asks for title and requires a target Obsidian folder.
  - Lets the user choose the note language for the current note.
  - Lets the user choose the LM Studio model for the current note.
  - Adds note jobs to a queue.
  - Sends source text to LM Studio.
  - Sends generated Markdown to the native host.
- Queue monitor
  - Processes queued notes one at a time.
  - Shows job status and saved output.
  - Lets the user stop, remove, or copy completed note output.
- Python native host
  - Lists folders from the configured Obsidian vault.
  - Receives Markdown from Chrome through Native Messaging.
  - Creates a safe Windows filename.
  - Saves a `.md` file into the selected Obsidian vault folder.

## Note Rules

The current note structure and quality rules live in `docs/note-generation-rules.md`.

Generated notes should teach the topic, explain mechanisms, ignore page UI noise, and stay useful as future Obsidian reference material.

## Local LLM

The extension expects LM Studio to expose an OpenAI-compatible local API:

```text
http://localhost:1234/v1/chat/completions
```

The popup also reads available models from:

```text
http://localhost:1234/v1/models
```

## Naming

The whole project is `Note Taker`.

The Chrome extension is named `Obsidian Note Taker`.
