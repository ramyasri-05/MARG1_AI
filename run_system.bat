@echo off
echo Starting MARG-AI System...

echo Starting Backend...
start "MARG-AI Backend" cmd /k "cd backend && npm start"

echo Starting Frontend...
start "MARG-AI Frontend" cmd /k "cd frontend && npm run dev"

echo Starting AI Simulation...
start "MARG-AI Simulation" cmd /k "cd ai && python detect_and_track.py"

echo All systems started!
echo Open http://localhost:5173
pause
