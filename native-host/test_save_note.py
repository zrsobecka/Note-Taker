from chrome_note_clipper_host import list_folders, save_note


def main():
    folders = list_folders({})
    print(f"Folders found: {len(folders['folders'])}")
    target_folder = folders["folders"][0] if folders["folders"] else ""

    result = save_note(
        {
            "title": "Chrome Note Clipper Test",
            "folder": target_folder,
            "markdown": "# Chrome Note Clipper Test\n\n## W skrócie\n\nTest zapisu z Python helpera.\n",
        }
    )
    print(result["path"])


if __name__ == "__main__":
    main()
