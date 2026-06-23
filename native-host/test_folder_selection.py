import unittest
from pathlib import Path
import sys
from tempfile import TemporaryDirectory

sys.path.insert(0, str(Path(__file__).resolve().parent))

from chrome_note_clipper_host import resolve_initial_folder, resolve_target_folder


class FolderSelectionTests(unittest.TestCase):
    def test_resolves_absolute_local_save_folder_without_vault(self):
        with TemporaryDirectory() as temp_dir:
            target = Path(temp_dir) / "Any Notes Folder"
            target.mkdir(parents=True)

            result = resolve_target_folder({"default_save_folder": ""}, "", str(target))

            self.assertEqual(result, target.resolve())

    def test_uses_configured_default_save_folder_when_job_has_no_folder_path(self):
        with TemporaryDirectory() as temp_dir:
            target = Path(temp_dir) / "Default Notes"

            result = resolve_target_folder({"default_save_folder": str(target)}, "", "")

            self.assertEqual(result, target.resolve())
            self.assertTrue(target.exists())

    def test_keeps_legacy_vault_relative_folder_support(self):
        with TemporaryDirectory() as temp_dir:
            vault = Path(temp_dir) / "Vault"
            target = vault / "Projects" / "AI Notes"
            vault.mkdir()

            result = resolve_target_folder({"vault_path": str(vault)}, "Projects/AI Notes", "")

            self.assertEqual(result, target.resolve())
            self.assertTrue(target.exists())

    def test_picker_initial_folder_falls_back_to_home_without_configured_folder(self):
        result = resolve_initial_folder({"default_save_folder": ""})

        self.assertEqual(result, Path.home().resolve())


if __name__ == "__main__":
    unittest.main()
