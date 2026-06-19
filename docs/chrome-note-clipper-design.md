# Chrome Note Clipper Design

Chrome Note Clipper is the first module of the Note Taker project.

## Goal

Turn selected or copied browser text into a clean Obsidian Markdown note using a local LM Studio model.

## Components

- Chrome extension
  - Reads selected text from the active tab.
  - Falls back to clipboard text.
  - Asks for title and requires a target Obsidian folder.
  - Sends source text to LM Studio.
  - Sends generated Markdown to the native host.
- Python native host
  - Lists folders from the configured Obsidian vault.
  - Receives Markdown from Chrome through Native Messaging.
  - Creates a safe Windows filename.
  - Saves a `.md` file into the selected Obsidian vault folder.

## Note Structure

```markdown
# {title}

## W skrócie

## Najważniejsze

## Jak o tym myśleć

## Przydatne w praktyce

## Słowa-klucze
```

## Local LLM

The extension expects LM Studio to expose an OpenAI-compatible local API:

```text
http://localhost:1234/v1/chat/completions
```

## Naming

The whole project is `Note Taker`.

The Chrome feature is named `Chrome Note Clipper`.
