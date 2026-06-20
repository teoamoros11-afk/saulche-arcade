#!/usr/bin/env python3
"""
MENTIS Launcher - Inicia servidor y abre el juego
"""
import http.server
import socketserver
import webbrowser
import threading
import os
import sys

PORT = 8080
MENTIS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'mentis')

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=MENTIS_DIR, **kwargs)
    
    def log_message(self, format, *args):
        pass  # Silenciar logs

def start_server():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        httpd.serve_forever()

print(f"🧠 Iniciando MENTIS en http://localhost:{PORT}")
print("Presiona Ctrl+C para cerrar")

# Iniciar servidor en hilo separado
server_thread = threading.Thread(target=start_server, daemon=True)
server_thread.start()

# Abrir navegador
webbrowser.open(f"http://localhost:{PORT}")

# Mantener el servidor corriendo
try:
    while True:
        pass
except KeyboardInterrupt:
    print("\n👋 MENTIS cerrado")
    sys.exit(0)