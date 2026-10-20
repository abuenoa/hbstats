#!/usr/bin/env python3
# HBStats — Copyright (C) 2026 Antonio Bueno Antón. SPDX-License-Identifier: AGPL-3.0-or-later
"""Run the in-page test suite (tests/inject.js) against src/app.html in headless Chrome.

The suite runs inside the app's own scope (it calls internal functions directly), so the script is spliced in just
before the app's closing IIFE. Exit code 1 on any failure.
Usage: python3 tools/run_tests.py
"""
import html
import pathlib
import re
import sys
import tempfile

from chrome import run_chrome

ROOT = pathlib.Path(__file__).resolve().parent.parent
APP_END = "})();"
START_DELAY_MS = 300
STDERR_TAIL_LINES = 40
# Virtual time Chrome gives the page before dumping it: the suite's timers (arming, the clock) and the PDF library
# download must fit, or the dump has no results. Virtual time only advances while the page is idle.
VIRTUAL_TIME_BUDGET_MS = 60000


def build_test_page() -> str:
    app = (ROOT / "src" / "app.html").read_text(encoding="utf-8")
    suite = (ROOT / "tests" / "inject.js").read_text(encoding="utf-8")
    cut = app.rfind(APP_END)
    if cut < 0:
        raise ValueError("src/app.html must end its script with an IIFE '})();'")
    injected = f"  setTimeout(() => {{\n{suite}\n  }}, {START_DELAY_MS});\n"
    return f'<!doctype html><html><head><meta charset="utf-8"></head><body>{app[:cut]}{injected}{app[cut:]}</body></html>'


def main() -> int:
    with tempfile.TemporaryDirectory() as tmp:
        page = pathlib.Path(tmp) / "test.html"
        page.write_text(build_test_page(), encoding="utf-8")
        chrome = run_chrome(page, "--window-size=1280,800", f"--virtual-time-budget={VIRTUAL_TIME_BUDGET_MS}", "--dump-dom", "--enable-logging=stderr")
    found = re.search(r'<pre id="res">(.*?)</pre>', chrome.stdout, re.S)
    if not found:
        print(f"No results: the suite did not finish (Chrome exit code {chrome.returncode}). Browser output:")
        print("\n".join(chrome.stderr.splitlines()[-STDERR_TAIL_LINES:]))
        return 1
    lines = html.unescape(found.group(1)).splitlines()
    passed = [l for l in lines if l.startswith("OK")]
    failed = [l for l in lines if l.startswith("FAIL")]
    for line in lines:
        if not line.startswith("OK"):
            print(line)
    print(f"{len(passed)} passed, {len(failed)} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
