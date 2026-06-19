# Project Instructions for Codex

## Project Shape

This is a local Windows Chrome extension project for creating Obsidian notes from browser content.

- `extension/` contains the Chrome extension UI, queue monitor, LM Studio calls, and prompt-building code.
- `native-host/` contains the Python native messaging host that saves Markdown files into an Obsidian vault.
- `docs/note-generation-rules.md` is the human-readable source of the note quality rules.
- `docs/chrome-note-clipper-design.md` is the product and architecture overview.

## Safety

- Never commit local machine config files:
  - `native-host/config.json`
  - `native-host/chrome_note_clipper_host.json`
- Use and update the example files instead:
  - `native-host/config.example.json`
  - `native-host/chrome_note_clipper_host.example.json`
- Do not add real Obsidian vault paths, Chrome extension IDs, private local paths, API keys, tokens, or personal machine details to tracked files.

## Prompt Rules

Until prompt construction is refactored into one shared helper, note-generation rules must stay aligned in three places:

- `docs/note-generation-rules.md`
- `extension/queue.js`
- `extension/service_worker.js`

When changing note behavior, update all three or explicitly explain why only one layer changed.

## Frontend Style

Keep the extension UI calm, dark, compact, and practical.

- Use purple as an accent, not a loud full-background theme.
- Keep buttons dark with purple text/accent states.
- Avoid adding large explanatory text blocks inside the UI.
- Popup and monitor should feel visually consistent because both use `extension/popup.css`.

## Verification

For JavaScript changes, run syntax checks:

```powershell
node --check extension\popup.js
node --check extension\queue.js
node --check extension\service_worker.js
```

If local `node` is not on PATH, use the bundled Codex Node runtime.

For Python changes in `native-host/`, run:

```powershell
python -m py_compile native-host\install_native_host.py native-host\chrome_note_clipper_host.py
```

## Current Product Behavior

The popup can create notes from these text sources:

- auto: selected text first, then clipboard;
- selected text only;
- clipboard only;
- full page text.

Each queued note also stores its selected note language and LM Studio model.
