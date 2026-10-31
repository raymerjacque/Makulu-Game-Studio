#!/usr/bin/env bash
# MakuluLinux Game Studio Launcher Script

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "=================================================="
echo "      🚀 Launching MakuluLinux Game Studio        "
echo "=================================================="

# Check if Vite dev server is running on port 3000
if ! nc -z localhost 3000 2>/dev/null; then
    echo "Starting Vite Dev Server..."
    npm run dev &
    SERVER_PID=$!
    sleep 1.5
fi

# Launch mode check
if [ "$1" == "--browser" ]; then
    echo "Opening MakuluLinux Game Studio in web browser..."
    xdg-open "http://127.0.0.1:3000"
else
    echo "Launching MakuluLinux Game Studio Desktop (Electron)..."
    npx electron electron.cjs
fi
