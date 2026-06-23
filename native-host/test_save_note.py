from chrome_note_clipper_host import load_config, resolve_configured_save_folder, save_note


def main():
    target_folder = str(resolve_configured_save_folder(load_config()))

    result = save_note(
        {
            "title": "Note Taker Test",
            "folderPath": target_folder,
            "markdown": "# Note Taker Test\n\n## W skrócie\n\nTest zapisu z Python helpera.\n",
        }
    )
    print(result["path"])


if __name__ == "__main__":
    main()
