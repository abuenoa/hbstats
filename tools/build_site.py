#!/usr/bin/env python3
# HBStats — Copyright (C) 2026 Antonio Bueno Antón. SPDX-License-Identifier: AGPL-3.0-or-later
"""Build the published site in docs/: one installable app for every team, at the site root.

docs/ gets:
  index.html            src/app.html wrapped in a full document, with the Supabase project from config/cloud.json
                        (no file = no accounts: teams and matches stay on each device)
  manifest.webmanifest  app name, colours and icons
  sw.js                 the service worker, stamped with a content hash and the Supabase library URL
  icons/                copied from assets/icons/ (run tools/make_icons.py first)
  demo/index.html       the public demo: the same app on the sample match in progress, no sign-in, nothing saved

src/app.html stays the single source of the app (it is also publishable alone, which is why it has no
<html>/<head> of its own). docs/ is regenerated from scratch on every build.

Usage: python3 tools/build_site.py
"""
import base64
import binascii
import hashlib
import json
import pathlib
import re
import shutil

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
OUT = ROOT / "docs"
ICONS = ROOT / "assets" / "icons"
CLOUD_FILE = ROOT / "config" / "cloud.json"
CLOUD_BLOCK = re.compile(r"(/\* CLOUD[^\n]*\n[^\n]*\*/\n\s*const CLOUD_CONFIG = ).*?(;\n\s*/\* /CLOUD \*/)", re.S)
DEMO_BLOCK = re.compile(r"(/\* DEMO[^\n]*\*/\n\s*const DEMO = ).*?(;\n\s*/\* /DEMO \*/)", re.S)
SUPABASE_JS = re.compile(r"const SUPABASE_JS_URL = '(https://cdn\.jsdelivr\.net/npm/@supabase/supabase-js@\d+\.\d+\.\d+/[^']+)';")
SUPABASE_URL = re.compile(r"^https://[a-z0-9-]+\.supabase\.co$")
ICON_FILES = ("favicon-32.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png")
BACKGROUND = "#f4f3f0"
THEME = "#151515"

PAGE_HEAD = """<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="{theme}">
"""
# Only the app installs and works offline; the demo is a plain page that borrows its icon.
INSTALL_HEAD = """<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="HBStats">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
"""
DEMO_HEAD = """<link rel="icon" href="../icons/favicon-32.png" sizes="32x32">
"""
RESET_STYLE = """<style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>
"""

SW_REGISTER = """<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((err) => console.error('Offline mode unavailable', err));
  });
}
</script>
"""

def is_public_key(key: str) -> bool:
    """True for a publishable key (sb_publishable_...) or a legacy JWT whose role is anon; never a secret key."""
    if key.startswith("sb_publishable_"):
        return True
    parts = key.split(".")
    if len(parts) != 3:
        return False
    try:
        claims = json.loads(base64.urlsafe_b64decode(parts[1] + "=" * (-len(parts[1]) % 4)))
    except (binascii.Error, ValueError):
        return False
    return claims.get("role") == "anon"


def cloud_config() -> dict | None:
    """The Supabase project the app signs in to, or None when config/cloud.json does not exist."""
    if not CLOUD_FILE.exists():
        return None
    data = json.loads(CLOUD_FILE.read_text(encoding="utf-8"))
    url, key = data.get("url", ""), data.get("anonKey", "")
    if not SUPABASE_URL.match(url):
        raise ValueError("config/cloud.json: url must be the project URL, like https://abcd1234.supabase.co")
    if not is_public_key(key):
        raise ValueError("config/cloud.json: anonKey must be the project's publishable key (sb_publishable_...) or legacy anon key, never a secret key")
    return {"url": url, "anonKey": key}


def split_head(app: str) -> tuple[str, str]:
    """Return (title/fonts/style block, rest): the leading block belongs in <head>."""
    end = app.find("</style>")
    if end < 0:
        raise ValueError("src/app.html must start with its <title>, font links and <style> block")
    end += len("</style>")
    return app[:end], app[end:]


def set_block(app: str, pattern: re.Pattern, value, name: str) -> str:
    app, count = pattern.subn(lambda m: f"{m.group(1)}{json.dumps(value, ensure_ascii=False)}{m.group(2)}", app)
    if count != 1:
        raise ValueError(f"src/app.html must contain exactly one /* {name} */ ... /* /{name} */ block")
    return app


def app_page(app: str, cloud: dict | None, offline: bool = True) -> str:
    head, body = split_head(set_block(set_block(app, CLOUD_BLOCK, cloud, "CLOUD"), DEMO_BLOCK, False, "DEMO"))
    register = SW_REGISTER if offline else ""
    return f"{PAGE_HEAD.format(theme=THEME)}{INSTALL_HEAD}{RESET_STYLE}{head}\n</head>\n<body>{body}\n{register}</body>\n</html>\n"


def demo_page(app: str) -> str:
    head, body = split_head(set_block(set_block(app, CLOUD_BLOCK, None, "CLOUD"), DEMO_BLOCK, True, "DEMO"))
    head = re.sub(r"<title>.*?</title>", "<title>HBStats · Demo</title>", head, count=1)
    return f"{PAGE_HEAD.format(theme=THEME)}{DEMO_HEAD}{RESET_STYLE}{head}\n</head>\n<body>{body}\n</body>\n</html>\n"


def manifest() -> str:
    return json.dumps({
        "name": "HBStats",
        "short_name": "HBStats",
        "description": "Estadísticas de balonmano en directo para tablet",
        "id": "./", "start_url": "./", "scope": "./",
        "display": "fullscreen", "display_override": ["fullscreen", "standalone"],
        "orientation": "landscape",
        "background_color": BACKGROUND, "theme_color": THEME,
        "lang": "es", "dir": "ltr", "categories": ["sports", "productivity"],
        "icons": [
            {"src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
            {"src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
            {"src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
        ],
    }, ensure_ascii=False, indent=2) + "\n"


def build(out: pathlib.Path = OUT, cloud: dict | None = None, offline: bool = True) -> str:
    """Regenerate the site in `out` and return its build hash. `offline=False` leaves the service worker out."""
    app = (SRC / "app.html").read_text(encoding="utf-8")
    sw = (SRC / "sw.js").read_text(encoding="utf-8")
    for placeholder in ("__BUILD__", "__SUPABASE_JS__"):
        if placeholder not in sw:
            raise ValueError(f"src/sw.js must contain the {placeholder} placeholder")
    library = SUPABASE_JS.search(app)
    if not library:
        raise ValueError("src/app.html must pin SUPABASE_JS_URL to an exact supabase-js version on cdn.jsdelivr.net")
    missing = [f for f in ICON_FILES if not (ICONS / f).exists()]
    if missing:
        raise FileNotFoundError(f"assets/icons/ lacks {', '.join(missing)}: run tools/make_icons.py")
    if out.exists():
        shutil.rmtree(out)
    (out / "icons").mkdir(parents=True)
    page = app_page(app, cloud, offline)
    build = hashlib.sha256(page.encode("utf-8")).hexdigest()[:12]
    (out / "index.html").write_text(page, encoding="utf-8")
    (out / "manifest.webmanifest").write_text(manifest(), encoding="utf-8")
    (out / "sw.js").write_text(sw.replace("__BUILD__", build).replace("__SUPABASE_JS__", library.group(1)), encoding="utf-8")
    for f in ICON_FILES:
        shutil.copyfile(ICONS / f, out / "icons" / f)
    (out / "demo").mkdir()
    (out / "demo" / "index.html").write_text(demo_page(app), encoding="utf-8")
    (out / ".nojekyll").write_text("", encoding="utf-8")
    return build


def main() -> None:
    cloud = cloud_config()
    print(f"docs/ (build {build(OUT, cloud)}, {'accounts on ' + cloud['url'] if cloud else 'no accounts: device only'})")


if __name__ == "__main__":
    main()
