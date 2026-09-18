# Production Deployment Guide

This guide details step-by-step deployment instructions for the **ShopEase Customer Support Conversational AI** application across modern cloud infrastructure.

---

## 1. System Architecture Overview

- **Frontend**: Single Page Application built with React 18 + Vite + Vanilla CSS (No Tailwind, No Bootstrap, No Next.js).
- **Backend**: Asynchronous Python REST API built with FastAPI + Pydantic v2 + Uvicorn.
- **AI & NLP Engine**:
  - Multiclass Intent Classifier: Sublinear TF-IDF + Calibrated Linear Model (88.72% test accuracy on Banking77).
  - Knowledge Base: PyMuPDF semantic extractor + Vector store over 14 official policy PDFs.
  - Security Guardrails: Prompt injection shield, sensitive PII masker, fraud escalation dispatch.

---

## 2. Local Setup & Execution

### Prerequisites
- Python 3.13 (`py -3.13`)
- Node.js v18+ & npm
- Git

### Step 1: Clone and Configure Environment
```bash
git clone <repository_url>
cd customer_support_AI
cp .env.example .env
```

### Step 2: Install Python Dependencies
```bash
py -3.13 -m pip install -r backend/requirements.txt
```

### Step 3: Run Preprocessing & Model Training (If needed)
```bash
py -3.13 scripts/prepare_data.py
py -3.13 scripts/train_model.py
py -3.13 scripts/build_knowledge_index.py
py -3.13 scripts/verify_system.py
```

### Step 4: Launch Backend Server
```bash
cd backend
py -3.13 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be live at: `http://localhost:8000/docs`.

### Step 5: Install and Launch Frontend
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 3. Production Deployment: Frontend (Vercel / Netlify)

### Vercel Deployment
1. Connect your Git repository to Vercel.
2. In the Vercel Dashboard:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Set Environment Variable:
   - `VITE_API_URL`: `https://your-backend-service.onrender.com/api`
4. Click **Deploy**.

### Netlify Deployment
Create `frontend/netlify.toml`:
```toml
[build]
  base = "frontend"
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 4. Production Deployment: Backend (Render / Railway)

### Render Deployment (Web Service)
1. In Render Dashboard, click **New + > Web Service**.
2. Select repository.
3. Configure settings:
   - **Environment**: `Python 3`
   - **Build Command**:
     ```bash
     pip install -r backend/requirements.txt && python scripts/prepare_data.py && python scripts/train_model.py && python scripts/build_knowledge_index.py
     ```
   - **Start Command**:
     ```bash
     cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
4. Set Environment Variables:
   - `DEBUG`: `False`
   - `CONFIDENCE_THRESHOLD`: `0.55`
   - `RELEVANCE_THRESHOLD`: `0.04`
5. Click **Create Web Service**.

### Railway Deployment
Create `Procfile` in root:
```
web: uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
```

---

## 5. Dockerized Deployment (Optional)

Create `Dockerfile`:
```dockerfile
FROM python:3.13-slim

WORKDIR /app
COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN python scripts/prepare_data.py && \
    python scripts/train_model.py && \
    python scripts/build_knowledge_index.py

EXPOSE 8000
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 6. Verification & Troubleshooting

Run the verification test suite post-deployment:
```bash
py -3.13 scripts/verify_system.py
```
Check health endpoint:
```bash
curl https://<your-backend-domain>/api/health
```
Check model metrics:
```bash
curl https://<your-backend-domain>/api/model-info
```
