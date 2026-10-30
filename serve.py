#!/usr/bin/env python3
"""Dev server: static files + `Cache-Control: no-store`, so edited ES modules are never served stale.

    python3 serve.py [port]        # default 5173  →  http://127.0.0.1:5173
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class NoStore(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
    handler = partial(NoStore, directory=str(Path(__file__).resolve().parent))
    print(f"http://127.0.0.1:{port}")
    ThreadingHTTPServer(("127.0.0.1", port), handler).serve_forever()
