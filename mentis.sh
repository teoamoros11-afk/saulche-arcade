#!/bin/bash
# MENTIS Quick Launch - Inicia servidor y abre navegador
# Uso: ./mentis.sh

cd "$(dirname "$0")/mentis"

echo "🧠 Iniciando servidor MENTIS..."
echo "📍 http://localhost:8080"
echo "⏹️  Presiona Ctrl+C para cerrar"
echo ""

python3 -m http.server 8080