import json
import re
import struct
import sys
from datetime import datetime
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
CONFIG_PATH = BASE_DIR / "config.json"
LOG_PATH = BASE_DIR / "native-host.log"
EXCLUDED_FOLDER_NAMES = {".git", ".obsidian", "__pycache__"}
WINDOWS_RESERVED_NAMES = {
    "CON",
    "PRN",
    "AUX",
    "NUL",
    "COM1",
    "COM2",
    "COM3",
    "COM4",
    "COM5",
    "COM6",
    "COM7",
    "COM8",
    "COM9",
    "LPT1",
    "LPT2",
    "LPT3",
    "LPT4",
    "LPT5",
    "LPT6",
    "LPT7",
    "LPT8",
    "LPT9",
}


def read_message():
    raw_length = sys.stdin.buffer.read(4)
    if len(raw_length) == 0:
        return None
    if len(raw_length) < 4:
        raise ValueError("Invalid native messaging message length.")

    message_length = struct.unpack("<I", raw_length)[0]
    message = sys.stdin.buffer.read(message_length).decode("utf-8")
    return json.loads(message)


def send_message(message):
    encoded = json.dumps(message, ensure_ascii=False).encode("utf-8")
    sys.stdout.buffer.write(struct.pack("<I", len(encoded)))
    sys.stdout.buffer.write(encoded)
    sys.stdout.buffer.flush()


def load_config():
    with CONFIG_PATH.open("r", encoding="utf-8") as file:
        return json.load(file)


def log_event(message):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with LOG_PATH.open("a", encoding="utf-8") as file:
        file.write(f"[{timestamp}] {message}\n")


def safe_filename(title):
    name = title.strip()
    name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "-", name)
    name = re.sub(r"\s+", " ", name)
    name = name.strip(" .")

    if not name:
        name = "Untitled note"

    if name.upper() in WINDOWS_RESERVED_NAMES:
        name = f"{name} note"

    return name[:120]


def unique_path(folder, base_name):
    path = folder / f"{base_name}.md"
    counter = 2

    while path.exists():
        path = folder / f"{base_name} {counter}.md"
        counter += 1

    return path


def resolve_vault_path(config):
    vault_path = config.get("vault_path")
    if not vault_path:
        raise ValueError("Vault path is not configured.")

    return Path(vault_path).expanduser().resolve()


def normalize_folder(folder):
    normalized = str(folder or "").replace("\\", "/").strip().strip("/")
    parts = [part for part in normalized.split("/") if part and part not in {".", ".."}]
    return "/".join(parts)


def is_excluded_folder(relative_folder, excluded_folders):
    normalized = normalize_folder(relative_folder).casefold()
    for excluded_folder in excluded_folders:
        excluded = normalize_folder(excluded_folder).casefold()
        if normalized == excluded or normalized.startswith(f"{excluded}/"):
            return True

    return False


def resolve_configured_save_folder(config):
    save_folder = config.get("default_save_folder") or config.get("save_folder")
    if save_folder:
        return Path(save_folder).expanduser().resolve()

    if config.get("vault_path"):
        return resolve_vault_path(config)

    raise ValueError("Choose a save folder first.")


def resolve_initial_folder(config):
    try:
        initial_path = resolve_configured_save_folder(config)
    except ValueError:
        return Path.home().resolve()

    if not initial_path.exists():
        return Path.home().resolve()

    return initial_path


def resolve_local_folder(folder_path):
    selected_path = Path(folder_path).expanduser().resolve()
    selected_path.mkdir(parents=True, exist_ok=True)

    if not selected_path.is_dir():
        raise ValueError("Selected path is not a folder.")

    return selected_path


def resolve_target_folder(config, folder="", folder_path=""):
    if folder_path:
        return resolve_local_folder(folder_path)

    if config.get("default_save_folder") or config.get("save_folder"):
        return resolve_local_folder(resolve_configured_save_folder(config))

    vault_path = resolve_vault_path(config)
    selected_folder = normalize_folder(folder)
    target_folder = (vault_path / selected_folder).resolve() if selected_folder else vault_path

    if target_folder != vault_path and vault_path not in target_folder.parents:
        raise ValueError("Selected folder is outside the Obsidian vault.")

    target_folder.mkdir(parents=True, exist_ok=True)
    return target_folder

def build_note_path(config, title, folder="", folder_path=""):
    target_folder = resolve_target_folder(config, folder, folder_path)
    base_name = safe_filename(title)
    if config.get("filename_date_prefix", True):
        base_name = f"{datetime.now().strftime('%Y-%m-%d')} {base_name}"

    return unique_path(target_folder, base_name)


def list_folders(_payload):
    config = load_config()
    if not config.get("vault_path"):
        return {"ok": True, "folders": []}

    vault_path = resolve_vault_path(config)

    if not vault_path.exists():
        raise ValueError(f"Vault path does not exist: {vault_path}")

    excluded_folders = config.get("excluded_folders", [])
    folders = []
    for path in vault_path.rglob("*"):
        if not path.is_dir():
            continue

        relative_parts = path.relative_to(vault_path).parts
        if any(part in EXCLUDED_FOLDER_NAMES or part.startswith(".") for part in relative_parts):
            continue

        relative_folder = "/".join(relative_parts)
        if is_excluded_folder(relative_folder, excluded_folders):
            continue

        folders.append(relative_folder)

    return {
        "ok": True,
        "folders": sorted(set(folders), key=str.casefold),
    }


def choose_folder(_payload):
    config = load_config()
    initial_path = resolve_initial_folder(config)

    try:
        import tkinter as tk
        from tkinter import filedialog
    except ImportError as error:
        raise ValueError("Folder picker is not available in this Python installation.") from error

    root = tk.Tk()
    root.withdraw()
    root.attributes("-topmost", True)

    try:
        selected_folder = filedialog.askdirectory(
            parent=root,
            title="Choose note save folder",
            initialdir=str(initial_path),
            mustexist=True,
        )
    finally:
        root.destroy()

    if not selected_folder:
        return {"ok": True, "cancelled": True, "folderPath": "", "folder": ""}

    selected_path = resolve_local_folder(selected_folder)
    return {
        "ok": True,
        "cancelled": False,
        "folderPath": str(selected_path),
        "folder": str(selected_path),
    }


def save_note(payload):
    config = load_config()
    title = payload.get("title", "Untitled note")
    folder = payload.get("folder", "")
    folder_path = payload.get("folderPath", "")
    markdown = payload.get("markdown", "").strip()

    if not markdown:
        raise ValueError("Markdown content is empty.")

    path = build_note_path(config, title, folder, folder_path)
    path.write_text(markdown + "\n", encoding="utf-8")
    log_event(f"Saved note: {path}")

    return {"ok": True, "path": str(path)}


def handle_message(message):
    action = message.get("action")

    if action == "listFolders":
        return list_folders(message)

    if action == "chooseFolder":
        return choose_folder(message)

    if action == "saveNote":
        return save_note(message)

    raise ValueError(f"Unknown action: {action}")


def main():
    while True:
        message = read_message()
        if message is None:
            break

        try:
            log_event(f"Received action: {message.get('action')}")
            send_message(handle_message(message))
        except Exception as error:
            log_event(f"Error: {error}")
            send_message({"ok": False, "error": str(error)})


if __name__ == "__main__":
    main()
