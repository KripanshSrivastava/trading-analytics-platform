# 🚀 Trade Analytics Platform - Quick Server Start Guide

## Prerequisites
- Python 3.13+ with venv activated
- Node.js 18+ with npm installed
- Port 8000 (backend) and 5173 (frontend) available

---

## 🔧 OPTION 1: Run Both Servers (Recommended for Development)

### Step 1: Terminal 1 - Start Backend
```bash
cd /Users/dhritismansarma/Desktop/Trade\ Analytics\ Platform
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000 \
  --reload-exclude 'venv/*' \
  --reload-exclude '.venv/*' \
  --reload-exclude 'frontend/node_modules/*' \
  --reload-exclude '*.log' \
  --reload-exclude '*.db' \
  --reload-exclude '__pycache__/*' \
  --reload-exclude '.git/*'
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

✅ Backend is ready at `http://localhost:8000`

---

### Step 2: Terminal 2 - Start Frontend
```bash
cd /Users/dhritismansarma/Desktop/Trade\ Analytics\ Platform/frontend
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

✅ Frontend is ready at `http://localhost:5173`

---

## ✅ Verify Both Servers

### Backend Health Check
```bash
curl http://localhost:8000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "data_provider": "yfinance",
  "cache": {...},
  "scheduler": {
    "running": true,
    "jobs": 5
  }
}
```

### Frontend Access
Open in browser: `http://localhost:5173`

You should see:
- ✅ Dashboard page with live market data
- ✅ Navigation working (Indicators, Risk, Backtest, etc.)
- ✅ No console errors
- ✅ Data loading from backend

---

## 📊 Running Test Suites

### Backend Tests (All 326 tests)
```bash
cd /Users/dhritismansarma/Desktop/Trade\ Analytics\ Platform
source venv/bin/activate
python -m pytest --tb=short -v
```

**Expected Result:**
```
====================== 326 passed, 151 warnings in ~21s ======================
```

### Frontend Tests (if configured)
```bash
cd frontend
npm test
```

---

## 🛑 Stopping Servers

### From Running Terminals
- Press `Ctrl+C` in each terminal

### Force Kill (if needed)
```bash
# Kill backend
pkill -f "uvicorn main:app"

# Kill frontend
pkill -f "vite"
```

---

## 🎯 Key Features

### Backend (Port 8000)
- FastAPI REST API
- SQLite database
- Background jobs (5 scheduled tasks)
- Cache system (1-hour TTL)
- All 326 tests passing

### Frontend (Port 5173)
- React 18 + Vite
- 7 pages (Dashboard, Indicators, Predict, Risk, Backtest, FII/DII, News)
- Live data refresh via React Query
- ErrorBoundary for error handling
- Dark/light theme ready

---

## 📝 Live Development

### Hot Module Replacement (HMR)
- **Frontend:** Changes auto-reload (npm run dev)
- **Backend:** Auto-reloads with `--reload` flag

### Monitor Changes
```bash
# Terminal 3: Watch logs
tail -f backend.log
tail -f frontend.log
```

---

## 🔗 API Endpoints

**Backend Base URL:** `http://localhost:8000`

### Core Endpoints
- `GET /health` - System health
- `GET /market?symbol=^NSEI&period=1mo` - Market data
- `GET /indicators?symbol=^NSEI&period=1mo` - Indicators
- `POST /risk/full_analysis` - Risk analysis
- `GET /backtest` - Backtesting
- `GET /news` - Financial news
- `GET /fii-dii` - FII/DII flows
- `GET /predict` - ML predictions

---

## 📚 Documentation

- **Backend Docs:** `http://localhost:8000/docs` (Swagger UI)
- **Backend Redoc:** `http://localhost:8000/redoc` (ReDoc)
- **Test Report:** `TEST_STATUS_REPORT.md`
- **Setup Guide:** `QUICK_START_GUIDE.md`

---

## ⚠️ Troubleshooting

### Backend won't start
```bash
# Port already in use?
lsof -i :8000
# Kill and retry
pkill -f "uvicorn main:app"
```

### Frontend won't start
```bash
# Port already in use?
lsof -i :5173
# Kill and retry
pkill -f "vite"
```

### Import errors in frontend
```bash
# Reinstall dependencies
cd frontend
rm -rf node_modules
npm install
npm run dev
```

### API calls failing
```bash
# Check backend is running
curl http://localhost:8000/health

# Check network tab in browser DevTools
# Verify API_BASE_URL in frontend config
```

---

## 🎉 Success Checklist

- [x] Backend running on port 8000
- [x] Frontend running on port 5173
- [x] Health endpoint responds
- [x] All pages load
- [x] Data displays correctly
- [x] No console errors
- [x] 326 tests passing

---

**Ready to trade! 📈**

Generated: April 24, 2026
