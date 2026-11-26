#!/usr/bin/env bash
# ==============================================================================
# Anti-Scam Event Ticketing Platform - Linux/macOS Bare-Metal Launcher
# ==============================================================================
set -e

echo "================================================================="
echo " Starting Anti-Scam Event Ticketing & Escrow Settlement Platform "
echo " Running directly on Bare-Metal Local OS Processes (No Docker)   "
echo "================================================================="

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Verify toolchains
echo -e "\n[1/5] Checking Toolchains..."
java -version 2>&1 | head -n 1
mvn -version | head -n 1
python3 --version
node -v

# Start Python Geo/Fraud & Scheduler Service (Port 8000)
echo -e "\n[2/5] Starting Python Geo/Fraud & Escrow Scheduler Service..."
cd "$ROOT_DIR/service-python"
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
PYTHON_PID=$!
echo "Python service started (PID: $PYTHON_PID)"

# Start Java Spring Boot Core Service (Port 8080)
echo -e "\n[3/5] Starting Java Spring Boot Financial & RBAC Service..."
cd "$ROOT_DIR/backend-java"
mvn spring-boot:run &
SPRING_PID=$!
echo "Spring Boot service started (PID: $SPRING_PID)"

# Start React Frontend (Port 5173)
echo -e "\n[4/5] Starting React Vite Frontend..."
cd "$ROOT_DIR/frontend-react"
npm run dev &
FRONTEND_PID=$!
echo "Frontend service started (PID: $FRONTEND_PID)"

echo "$PYTHON_PID" > "$ROOT_DIR/.python.pid"
echo "$SPRING_PID" > "$ROOT_DIR/.spring.pid"
echo "$FRONTEND_PID" > "$ROOT_DIR/.frontend.pid"

echo -e "\n================================================================="
echo " Services are live:"
echo " - Frontend UI:        http://localhost:5173"
echo " - Core Java API:      http://localhost:8080/api/health"
echo " - Python Fraud/Geo:   http://localhost:8000/api/geo/health"
echo "================================================================="
echo "To stop all services, run: ./stop-all.sh"
