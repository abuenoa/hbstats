#!/usr/bin/env python3
"""Build the installable web app in docs/ from src/.

src/app.html is the single source of the app (it is also what gets published as a Claude artifact, which is why
it has no <html>/<head> of its own). This script wraps it in a full document with the PWA head, stamps the service
worker with a content hash so each release refreshes the offline copy, and copies the manifest.

Usage: python3 tools/build_site.py
"""
import hashlib
import pathlib
import shutil

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
OUT = ROOT / "docs"

# The same base the artifact viewer gives the page (light scheme, safe-area padding, [hidden] support).
PWA_HEAD = """<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#d4202a">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="HBStats">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>
"""

SW_REGISTER = """<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((err) => console.error('Offline mode unavailable', err));
  });
}
</script>
"""


def split_head(app: str) -> tuple[str, str]:
    """Return (title/fonts/style block, rest): the leading block belongs in <head>."""
    end = app.find("</style>")
    if end < 0:
        raise ValueError("src/app.html must start with its <title>, font links and <style> block")
    end += len("</style>")
    return app[:end], app[end:]


def main() -> None:
    app = (SRC / "app.html").read_text(encoding="utf-8")
    head, body = split_head(app)
    page = f"{PWA_HEAD}{head}\n</head>\n<body>{body}\n{SW_REGISTER}</body>\n</html>\n"
    build = hashlib.sha256(page.encode("utf-8")).hexdigest()[:12]

    OUT.mkdir(exist_ok=True)
    (OUT / "index.html").write_text(page, encoding="utf-8")
    sw = (SRC / "sw.js").read_text(encoding="utf-8")
    if "__BUILD__" not in sw:
        raise ValueError("src/sw.js must contain the __BUILD__ placeholder")
    (OUT / "sw.js").write_text(sw.replace("__BUILD__", build), encoding="utf-8")
    shutil.copyfile(SRC / "manifest.webmanifest", OUT / "manifest.webmanifest")
    (OUT / ".nojekyll").write_text("", encoding="utf-8")
    print(f"Built docs/ (build {build})")


if __name__ == "__main__":
    main()
