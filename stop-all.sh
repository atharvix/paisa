#!/usr/bin/env bash
# ==============================================================================
# Graceful Stop Script for Linux / macOS
# ==============================================================================
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for PID_FILE in "$ROOT_DIR"/*.pid; do
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            echo "Terminating process $PID ($PID_FILE)..."
            kill "$PID" || kill -9 "$PID"
        fi
        rm -f "$PID_FILE"
    fi
done

# Secondary sweep by port
for PORT in 8080 8000 5173; do
    PIDS=$(lsof -ti :$PORT 2>/dev/null || true)
    if [ -n "$PIDS" ]; then
        echo "Releasing port $PORT (PIDs: $PIDS)..."
        kill -9 $PIDS 2>/dev/null || true
    fi
done

echo "All services stopped cleanly."
