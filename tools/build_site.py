#!/usr/bin/env python3
"""Build the published site in docs/: one installable app per club, plus a club list at the root.

For every club in tenants/<slug>/ (see tools/tenants.py) this writes docs/<slug>/ with:
  index.html            src/app.html wrapped in a full document, with the club's TENANT object, brand colours,
                        name and inlined scoreboard crest
  manifest.webmanifest  the club's app name, colours and icons
  sw.js                 the service worker, stamped with the club and a content hash (offline copy per club)
  icons/                copied from tenants/<slug>/icons/ (run tools/make_icons.py first)
docs/index.html lists the clubs; docs/sw.js retires the service worker of the old single-club layout.

src/app.html stays the single source of the app (it is also publishable alone, which is why it has no
<html>/<head> of its own). docs/ is regenerated from scratch on every build.

Usage: python3 tools/build_site.py
"""
import base64
import hashlib
import html
import json
import re
import shutil

from tenants import ROOT, load_tenants, rgb_triplet

SRC = ROOT / "src"
OUT = ROOT / "docs"
TENANT_BLOCK = re.compile(r"(/\* TENANT[^\n]*\*/\n\s*const TENANT = ).*?(;\n\s*/\* /TENANT \*/)", re.S)
BAR_CREST = re.compile(r'(<img class="crest" alt="" src=")data:image/png;base64,[^"]*(")')
ICON_FILES = ("favicon-32.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png")
BACKGROUND = "#f4f3f0"

PWA_HEAD = """<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="{brand}">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="{team}">
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

# The first release served one club from the site root with a service worker scoped to the whole site; this
# replacement clears that offline copy and unregisters itself so it never answers for the club folders.
RETIRED_ROOT_SW = """/* Retired: each club now has its own folder (and service worker). Clear the old offline copy and step aside. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n.startsWith('hbstats-shell-') || n === 'hbstats-runtime-v1').map((n) => caches.delete(n)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((client) => client.navigate(client.url));
  })());
});
"""


def split_head(app: str) -> tuple[str, str]:
    """Return (title/fonts/style block, rest): the leading block belongs in <head>."""
    end = app.find("</style>")
    if end < 0:
        raise ValueError("src/app.html must start with its <title>, font links and <style> block")
    end += len("</style>")
    return app[:end], app[end:]


def tenant_object(t: dict) -> dict:
    keys = ("slug", "club", "team", "brand", "brand2", "brandInk", "roster", "legacyStorageKey")
    return {k: t[k] for k in keys if k in t}


def club_page(app: str, t: dict, crest_png: bytes) -> str:
    app, count = TENANT_BLOCK.subn(lambda m: f"{m.group(1)}{json.dumps(tenant_object(t), ensure_ascii=False)}{m.group(2)}", app)
    if count != 1:
        raise ValueError("src/app.html must contain exactly one /* TENANT */ ... /* /TENANT */ block")
    crest = base64.b64encode(crest_png).decode("ascii")
    app, count = BAR_CREST.subn(lambda m: f"{m.group(1)}data:image/png;base64,{crest}{m.group(2)}", app)
    if count != 1:
        raise ValueError('src/app.html must contain exactly one <img class="crest" ...> scoreboard crest')
    head, body = split_head(app)
    head = re.sub(r"<title>.*?</title>", f"<title>{html.escape(t['team'])} · HBStats</title>", head, count=1)
    brand = (f"<style>:root{{--brand:{t['brand']};--brand-rgb:{rgb_triplet(t['brand'])};"
             f"--brand-2-rgb:{rgb_triplet(t['brand2'])};--brand-ink:{t['brandInk']}}}</style>")
    return f"{PWA_HEAD.format(brand=t['brand'], team=html.escape(t['team']))}{head}\n{brand}\n</head>\n<body>{body}\n{SW_REGISTER}</body>\n</html>\n"


def manifest(t: dict) -> str:
    return json.dumps({
        "name": f"HBStats · {t['club']}",
        "short_name": t["team"],
        "description": f"Estadísticas de balonmano en directo para tablet · {t['club']}",
        "id": "./", "start_url": "./", "scope": "./",
        "display": "fullscreen", "display_override": ["fullscreen", "standalone"],
        "orientation": "landscape",
        "background_color": BACKGROUND, "theme_color": t["brand"],
        "lang": "es", "dir": "ltr", "categories": ["sports", "productivity"],
        "icons": [
            {"src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
            {"src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
            {"src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
        ],
    }, ensure_ascii=False, indent=2) + "\n"


def club_list(tenants: list[dict]) -> str:
    cards = "\n".join(
        f'<a class="club" href="./{t["slug"]}/"><img src="./{t["slug"]}/icons/icon-192.png" alt="" width="96" height="96">'
        f'<span>{html.escape(t["club"])}</span></a>' for t in tenants)
    return f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>HBStats · Clubs</title>
<link rel="icon" href="./{tenants[0]['slug']}/icons/favicon-32.png" sizes="32x32">
<style>
:root{{color-scheme:light dark;--bg:#f4f3f0;--fg:#151515;--card:#fff;--line:rgba(0,0,0,.1)}}
@media (prefers-color-scheme:dark){{:root{{--bg:#0e0e10;--fg:#f4f3f0;--card:#18181b;--line:rgba(255,255,255,.1)}}}}
body{{margin:0;padding:32px 16px;background:var(--bg);color:var(--fg);font:16px system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}}
h1{{margin:0 0 6px;font-size:30px}} p{{margin:0 0 24px;opacity:.7}}
.clubs{{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;max-width:900px}}
.club{{display:grid;justify-items:center;gap:10px;padding:18px;border-radius:18px;background:var(--card);border:1px solid var(--line);color:inherit;text-decoration:none;font-weight:700;text-align:center}}
</style>
</head>
<body>
<h1>HBStats</h1>
<p>Estadísticas de balonmano en directo. Elige tu club e instala la app desde su página.</p>
<div class="clubs">
{cards}
</div>
</body>
</html>
"""


def main() -> None:
    tenants = load_tenants()
    app = (SRC / "app.html").read_text(encoding="utf-8")
    sw = (SRC / "sw.js").read_text(encoding="utf-8")
    for placeholder in ("__BUILD__", "__CLUB__"):
        if placeholder not in sw:
            raise ValueError(f"src/sw.js must contain the {placeholder} placeholder")
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir()
    for t in tenants:
        icons = t["dir"] / "icons"
        missing = [f for f in (*ICON_FILES, "crest-96.png") if not (icons / f).exists()]
        if missing:
            raise FileNotFoundError(f"tenants/{t['slug']}/icons/ lacks {', '.join(missing)}: run tools/make_icons.py {t['slug']}")
        out = OUT / t["slug"]
        (out / "icons").mkdir(parents=True)
        page = club_page(app, t, (icons / "crest-96.png").read_bytes())
        build = hashlib.sha256(page.encode("utf-8")).hexdigest()[:12]
        (out / "index.html").write_text(page, encoding="utf-8")
        (out / "manifest.webmanifest").write_text(manifest(t), encoding="utf-8")
        (out / "sw.js").write_text(sw.replace("__BUILD__", build).replace("__CLUB__", t["slug"]), encoding="utf-8")
        for f in ICON_FILES:
            shutil.copyfile(icons / f, out / "icons" / f)
        print(f"docs/{t['slug']}/ (build {build})")
    (OUT / "index.html").write_text(club_list(tenants), encoding="utf-8")
    (OUT / "sw.js").write_text(RETIRED_ROOT_SW, encoding="utf-8")
    (OUT / ".nojekyll").write_text("", encoding="utf-8")
    print("docs/index.html (club list)")


if __name__ == "__main__":
    main()
