#!/usr/bin/env python3
# HBStats — Copyright (C) 2026 Antonio Bueno Antón. SPDX-License-Identifier: AGPL-3.0-or-later
"""Serve a development build of the app and rebuild it whenever src/ or assets/icons/ change.

The development build has no accounts (teams and matches stay in the browser) and no service worker, so a reload
always shows the latest sources. It is written outside docs/, which stays the published site.

Usage: python3 tools/dev_server.py [--host 127.0.0.1] [--port 8080] [--out build/dev]
       docker compose up   (the same, in a container; see compose.yaml)
"""
import argparse
import functools
import http.server
import pathlib
import threading
import time

import build_site

WATCHED = (build_site.SRC, build_site.ICONS)
POLL_SECONDS = 1.0
DEFAULT_OUT = build_site.ROOT / "build" / "dev"
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8080


def sources_stamp() -> tuple:
    """Path, size and mtime of every watched file: it changes whenever a file is saved, added or removed."""
    return tuple(sorted(
        (str(f), f.stat().st_size, f.stat().st_mtime_ns)
        for folder in WATCHED for f in folder.rglob("*") if f.is_file()
    ))


def rebuild(out: pathlib.Path) -> None:
    try:
        print(f"[{time.strftime('%H:%M:%S')}] build {build_site.build(out, cloud=None, offline=False)}", flush=True)
    except (OSError, ValueError) as err:
        print(f"[{time.strftime('%H:%M:%S')}] build failed, still serving the previous one: {err}", flush=True)


def watch(out: pathlib.Path) -> None:
    stamp = sources_stamp()
    while True:
        time.sleep(POLL_SECONDS)
        current = sources_stamp()
        if current != stamp:
            stamp = current
            rebuild(out)


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--host", default=DEFAULT_HOST, help="address to listen on (0.0.0.0 inside a container)")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    parser.add_argument("--out", type=pathlib.Path, default=DEFAULT_OUT, help="folder for the development build")
    args = parser.parse_args()
    rebuild(args.out)
    threading.Thread(target=watch, args=(args.out,), daemon=True).start()
    handler = functools.partial(NoCacheHandler, directory=str(args.out))
    with http.server.ThreadingHTTPServer((args.host, args.port), handler) as server:
        print(f"Serving the development build on port {args.port} (open http://localhost:{args.port}/)", flush=True)
        server.serve_forever()


if __name__ == "__main__":
    main()
