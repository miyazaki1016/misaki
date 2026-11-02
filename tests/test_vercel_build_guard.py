import subprocess
import unittest
from types import SimpleNamespace
from scripts.vercel_build_guard import may_skip

SHA = "a" * 40

def changed(*paths, code=0):
    return lambda *args, **kwargs: SimpleNamespace(returncode=code, stdout="\n".join(paths))

class BuildGuardTests(unittest.TestCase):
    def test_management_only_skips(self):
        self.assertTrue(may_skip(SHA, changed("docs/DEVELOPMENT_LEDGER.md", "scripts/pr_approval_routing.py")))
    def test_app_change_builds(self):
        self.assertFalse(may_skip(SHA, changed("app/page.tsx")))
    def test_mixed_change_builds(self):
        self.assertFalse(may_skip(SHA, changed("docs/DEVELOPMENT_LEDGER.md", "app/page.tsx")))
    def test_unknown_code_builds(self):
        self.assertFalse(may_skip(SHA, changed("scripts/notification.py")))
    def test_missing_previous_builds(self):
        self.assertFalse(may_skip("", changed("docs/DEVELOPMENT_LEDGER.md")))
    def test_failed_git_builds(self):
        self.assertFalse(may_skip(SHA, changed(code=128)))
    def test_no_differences_builds(self):
        self.assertFalse(may_skip(SHA, changed()))
    def test_bad_sha_builds(self):
        self.assertFalse(may_skip("not-a-sha", changed("docs/DEVELOPMENT_LEDGER.md")))

if __name__ == "__main__":
    unittest.main()
