#!/usr/bin/env bash
# MakuluLinux Game Studio - Root Launcher
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$DIR/editor/launch.sh" "$@"
