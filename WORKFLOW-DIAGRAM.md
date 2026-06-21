# Workflow Diagram

## Capture And Save Flow

```mermaid
flowchart TD
    A["User opens Chrome popup"] --> B["Choose source mode, title, folder, language, and model"]
    B --> C["Add note job to extension queue"]
    C --> D["Queue monitor processes one job at a time"]
    D --> E["Extract selected text, clipboard text, or page text"]
    E --> F["Build note prompt from source text and selected language"]
    F --> G["Send request to LM Studio localhost API"]
    G --> H["Receive generated Markdown"]
    H --> I["Send saveNote action through Chrome Native Messaging"]
    I --> J["Python native host validates folder and filename"]
    J --> K["Markdown file is written inside the configured Obsidian vault"]
```

## Folder Loading Flow

```mermaid
flowchart TD
    A["Popup or queue UI requests folders"] --> B["Extension sends listFolders action"]
    B --> C["Python native host reads native-host/config.json"]
    C --> D["Host scans configured vault"]
    D --> E["Host removes hidden and excluded folders"]
    E --> F["Extension displays folders in picker"]
```

## Local Data Boundaries

```mermaid
flowchart LR
    A["Chrome active tab / clipboard"] --> B["Extension storage and queue"]
    B --> C["LM Studio on localhost"]
    B --> D["Native Messaging host"]
    D --> E["Obsidian vault"]
    D --> F["Local native-host log"]
```

## Public Safety Notes

- Tracked files should contain only placeholders for vault paths and Chrome extension IDs.
- Real local config belongs in ignored files under `native-host/`.
- The default model endpoint is localhost; remote endpoints change the privacy boundary and should be documented in local setup notes.
