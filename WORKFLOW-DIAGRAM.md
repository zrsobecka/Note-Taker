# Workflow Diagram

## Capture And Save Flow

```mermaid
flowchart TD
    A["User opens Chrome popup"] --> B["Choose source mode, title, save folder, language, and model"]
    B --> B1["Browse opens durable folder picker window"]
    B1 --> B2["Native host returns selected local folderPath"]
    B2 --> B3["Extension stores folderPath in chrome.storage"]
    B --> C["Add note job to extension queue"]
    C --> D["Queue monitor processes one job at a time"]
    D --> E["Extract selected text, clipboard text, or page text"]
    E --> F["Build note prompt from source text and selected language"]
    F --> G["Send request to LM Studio localhost API"]
    G --> H["Receive generated Markdown"]
    H --> I["Send saveNote action through Chrome Native Messaging"]
    I --> J["Python native host resolves folderPath and safe filename"]
    J --> K["Markdown file is written inside the selected local folder"]
```

## Folder Selection Flow

```mermaid
flowchart TD
    A["User clicks Browse"] --> B["Popup opens folder_picker.html"]
    B --> C["Folder picker sends chooseFolder action"]
    C --> D["Python native host opens system folder dialog"]
    D --> E["Host returns absolute folderPath"]
    E --> F["Folder picker stores selectedSaveFolderPath"]
    F --> G["Popup and queue use folderPath for future saves"]
```

## Local Data Boundaries

```mermaid
flowchart LR
    A["Chrome active tab / clipboard"] --> B["Extension storage and queue"]
    B --> C["LM Studio on localhost"]
    B --> D["Native Messaging host"]
    D --> E["Selected local save folder"]
    D --> F["Local native-host log"]
```

## Public Safety Notes

- Tracked files should contain only placeholders for local save folders and Chrome extension IDs.
- Real local config belongs in ignored files under `native-host/`.
- The default model endpoint is localhost; remote endpoints change the privacy boundary and should be documented in local setup notes.
