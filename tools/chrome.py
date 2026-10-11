"""Locate and run a headless Chrome for the test and icon scripts (no browser automation library needed)."""
import glob
import os
import pathlib
import shutil
import subprocess
import tempfile

CHROME_GLOBS = [
    "~/.cache/ms-playwright/chromium_headless_shell-*/*/chrome-headless-shell",
    "~/.cache/ms-playwright/chromium-*/chrome-linux*/chrome",
]


def find_chrome() -> str:
    """CHROME env var first, then a Playwright-installed browser, then chrome/chromium on PATH."""
    if os.environ.get("CHROME"):
        return os.environ["CHROME"]
    for pattern in CHROME_GLOBS:
        found = sorted(glob.glob(os.path.expanduser(pattern)))
        if found:
            return found[-1]
    for name in ("google-chrome", "chromium", "chromium-browser"):
        path = shutil.which(name)
        if path:
            return path
    raise FileNotFoundError("No headless Chrome found: set the CHROME environment variable to its path")


def run_chrome(page: pathlib.Path, *flags: str, timeout: int = 90) -> str:
    """Load a local page in a throwaway profile and return Chrome's stdout."""
    with tempfile.TemporaryDirectory() as profile:
        result = subprocess.run(
            [find_chrome(), "--no-sandbox", "--disable-gpu", f"--user-data-dir={profile}", *flags, page.as_uri()],
            capture_output=True, text=True, timeout=timeout, check=False,
        )
    return result.stdout
