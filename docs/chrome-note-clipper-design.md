# Note Taker Design

First module of `Note Taker`: create useful Markdown notes from browser content using local LM Studio.

## Components

| Part | Responsibility |
|---|---|
| Chrome popup | Choose text source, title, local save folder, note language, and model; add jobs to queue. |
| Text sources | Auto selection→clipboard, selected only, clipboard only, full page text. |
| Queue monitor | Process one note at a time; show status; stop, remove, or copy jobs. |
| LM Studio | OpenAI-compatible local chat API and `/models` list. |
| Native host | Open the local folder picker, register with Chrome Native Messaging, and save generated Markdown safely into the selected local folder. |

## Note Rules

`docs/note-generation-rules.md` is the source of truth for note structure and quality.

Generated notes should teach the topic, explain mechanisms, ignore page UI noise, and stay useful as future Markdown reference material.

## Local API

```text
http://localhost:1234/v1/chat/completions
http://localhost:1234/v1/models
```

## Naming

- Project: `Note Taker`
- Chrome extension: `Note Taker`
