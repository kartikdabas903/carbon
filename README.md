# Carbon Footprint Tracker

This repository contains the Next.js frontend and Python FastAPI backend for the Carbon Footprint Tracker.

## Getting Started

To launch both the frontend and backend simultaneously, simply run the following script from the root directory:

```powershell
.\run.ps1
```

This will automatically open two new terminal windows:
- **Backend (FastAPI):** Runs on `http://localhost:8000`
- **Frontend (Next.js):** Runs on `http://localhost:3000`

### Manual Setup
If you prefer to run them separately:
1. **Backend:** `cd backend` -> `.\venv\Scripts\uvicorn main:app --reload --port 8000`
2. **Frontend:** `cd frontend` -> `npm run dev`