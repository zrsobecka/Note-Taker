# Obsidian Note Taker Design

First module of `Note Taker`: create useful Obsidian notes from browser content using local LM Studio.

## Components

| Part | Responsibility |
|---|---|
| Chrome popup | Choose text source, title, folder, note language, and model; add jobs to queue. |
| Text sources | Auto selection→clipboard, selected only, clipboard only, full page text. |
| Queue monitor | Process one note at a time; show status; stop, remove, or copy jobs. |
| LM Studio | OpenAI-compatible local chat API and `/models` list. |
| Native host | List vault folders and save generated Markdown safely into the selected folder. |

## Note Rules

`docs/note-generation-rules.md` is the source of truth for note structure and quality.

Generated notes should teach the topic, explain mechanisms, ignore page UI noise, and stay useful as future Obsidian reference material.

## Local API

```text
http://localhost:1234/v1/chat/completions
http://localhost:1234/v1/models
```

## Naming

- Project: `Note Taker`
- Chrome extension: `Obsidian Note Taker`
