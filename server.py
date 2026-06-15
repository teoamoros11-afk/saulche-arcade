#!/usr/bin/env python3
"""Simple HTTP server for Grizzy's Arcade.
Run: python3 server.py
Then open http://localhost:8080
"""
import http.server, socketserver, os, sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
DIR = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=DIR, **kw)
    def log_message(self, f, *a):
        print(f % a)

socketserver.TCPServer.allow_reuse_address = True
print(f"Grizzy's Arcade en http://localhost:{PORT}")
print("Pulsa Ctrl+C para parar")
with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor parado")
