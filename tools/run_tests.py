#!/usr/bin/env python3
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
        dom = run_chrome(page, "--window-size=1280,800", "--virtual-time-budget=15000", "--dump-dom")
    found = re.search(r'<pre id="res">(.*?)</pre>', dom, re.S)
    if not found:
        print("No results: the suite did not finish (check the browser console)")
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
