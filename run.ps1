Write-Host "Starting Carbon Footprint Tracker..." -ForegroundColor Cyan

# Start the Python FastAPI Backend in a new window
Write-Host "Starting FastAPI Backend (Port 8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\uvicorn main:app --reload --port 8000"

# Start the Next.js Frontend in a new window
Write-Host "Starting Next.js Frontend (Port 3000)..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Both servers are booting up in new terminal windows!" -ForegroundColor Yellow
