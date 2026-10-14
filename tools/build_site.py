#!/usr/bin/env python3
# HBStats — Copyright (C) 2026 Antonio Bueno Antón. SPDX-License-Identifier: AGPL-3.0-or-later
"""Build the published site in docs/: one installable app for every team, at the site root.

docs/ gets:
  index.html            src/app.html wrapped in a full document, with the Supabase project from config/cloud.json
                        (no file = no accounts: teams and matches stay on each device)
  manifest.webmanifest  app name, colours and icons
  sw.js                 the service worker, stamped with a content hash and the Supabase library URL
  icons/                copied from assets/icons/ (run tools/make_icons.py first)
  <club>/               for each retired per-club address (RETIRED_CLUBS): a page that sends visitors to the app and
                        a service worker that clears that club's old offline copy

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
SUPABASE_JS = re.compile(r"const SUPABASE_JS_URL = '(https://cdn\.jsdelivr\.net/npm/@supabase/supabase-js@\d+\.\d+\.\d+/[^']+)';")
SUPABASE_URL = re.compile(r"^https://[a-z0-9-]+\.supabase\.co$")
ICON_FILES = ("favicon-32.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png")
# Clubs that had their own address before accounts; their old links and installed apps now lead to the app.
RETIRED_CLUBS = ("triana", "triana-fem")
BACKGROUND = "#f4f3f0"
THEME = "#151515"

PWA_HEAD = """<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="{theme}">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="HBStats">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<style>:root{{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}body{{margin:0;font:14px system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}}img{{max-width:100%}}[hidden]{{display:none!important}}</style>
"""

SW_REGISTER = """<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((err) => console.error('Offline mode unavailable', err));
  });
}
</script>
"""

RETIRED_PAGE = """<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="0; url=../">
<title>HBStats</title>
</head>
<body style="font:16px system-ui,sans-serif;padding:24px">
<p>HBStats ahora funciona con cuentas: <a href="../">entra con tu usuario</a>. Si en esta tablet había un partido a medias, la app te ofrecerá importarlo.</p>
<script>
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch((err) => console.error('Old offline copy not cleared', err));
location.replace('../');
</script>
</body>
</html>
"""

# Clears the club's old offline copy, steps aside and sends any open club page to the app.
RETIRED_SW = """/* Retired: HBStats now runs at the site root with accounts. Clear this club's old offline copy and step aside. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n.startsWith('hbstats-__CLUB__-')).map((n) => caches.delete(n)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((client) => client.navigate(new URL('../', self.registration.scope).href));
  })());
});
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


def app_page(app: str, cloud: dict | None) -> str:
    app, count = CLOUD_BLOCK.subn(lambda m: f"{m.group(1)}{json.dumps(cloud, ensure_ascii=False)}{m.group(2)}", app)
    if count != 1:
        raise ValueError("src/app.html must contain exactly one /* CLOUD */ ... /* /CLOUD */ block")
    head, body = split_head(app)
    return f"{PWA_HEAD.format(theme=THEME)}{head}\n</head>\n<body>{body}\n{SW_REGISTER}</body>\n</html>\n"


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


def main() -> None:
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
    cloud = cloud_config()
    if OUT.exists():
        shutil.rmtree(OUT)
    (OUT / "icons").mkdir(parents=True)
    page = app_page(app, cloud)
    build = hashlib.sha256(page.encode("utf-8")).hexdigest()[:12]
    (OUT / "index.html").write_text(page, encoding="utf-8")
    (OUT / "manifest.webmanifest").write_text(manifest(), encoding="utf-8")
    (OUT / "sw.js").write_text(sw.replace("__BUILD__", build).replace("__SUPABASE_JS__", library.group(1)), encoding="utf-8")
    for f in ICON_FILES:
        shutil.copyfile(ICONS / f, OUT / "icons" / f)
    for club in RETIRED_CLUBS:
        (OUT / club).mkdir()
        (OUT / club / "index.html").write_text(RETIRED_PAGE, encoding="utf-8")
        (OUT / club / "sw.js").write_text(RETIRED_SW.replace("__CLUB__", club), encoding="utf-8")
    (OUT / ".nojekyll").write_text("", encoding="utf-8")
    print(f"docs/ (build {build}, {'accounts on ' + cloud['url'] if cloud else 'no accounts: device only'})")


if __name__ == "__main__":
    main()
