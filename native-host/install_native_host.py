import argparse
import json
import winreg
from pathlib import Path


HOST_NAME = "com.note_taker.chrome_note_clipper"
BASE_DIR = Path(__file__).resolve().parent
MANIFEST_PATH = BASE_DIR / "chrome_note_clipper_host.json"
MANIFEST_EXAMPLE_PATH = BASE_DIR / "chrome_note_clipper_host.example.json"
REGISTRY_KEY = rf"Software\Google\Chrome\NativeMessagingHosts\{HOST_NAME}"


def parse_args():
    parser = argparse.ArgumentParser(
        description="Register the Note Taker native messaging host."
    )
    parser.add_argument(
        "--extension-id",
        help="Chrome extension ID from chrome://extensions.",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    if not MANIFEST_PATH.exists():
        MANIFEST_PATH.write_text(
            MANIFEST_EXAMPLE_PATH.read_text(encoding="utf-8"),
            encoding="utf-8",
        )

    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    manifest["path"] = str((BASE_DIR / "chrome_note_clipper_host.bat").resolve())

    if args.extension_id:
        manifest["allowed_origins"] = [f"chrome-extension://{args.extension_id}/"]

    MANIFEST_PATH.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    with winreg.CreateKey(winreg.HKEY_CURRENT_USER, REGISTRY_KEY) as key:
        winreg.SetValueEx(key, None, 0, winreg.REG_SZ, str(MANIFEST_PATH.resolve()))

    print(f"Registered {HOST_NAME}")
    print(str(MANIFEST_PATH.resolve()))

    if not args.extension_id:
        print("Warning: run again with --extension-id after loading the Chrome extension.")


if __name__ == "__main__":
    main()
