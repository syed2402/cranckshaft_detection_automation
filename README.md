# Crankshaft Detection Automation

A web-based engineering decision support system for crankshaft crowning/profile evaluation.

## Features

- Upload and analyze crankshaft profile files (TXT/CSV)
- Automatic feature extraction and decision analysis
- Trend visualization and monitoring
- Operator override capability
- Confidence scoring and explainability

## Backend Setup

```bash
cd backend
pip install -r requirements.txt
python main.py
```

Backend runs on `http://localhost:8765` by default.

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Deployment

This project is configured for Railway deployment:

1. Push to GitHub
2. Connect repository to Railway
3. Set root directory to `backend`
4. Deploy!

## Input Format

TXT or CSV with one profile per file:

```csv
X,Y
0.0,337.392
0.1,337.393
0.2,337.395
```

Comma or tab separated files are supported. X values must be monotonically increasing and at least 50 coordinate points are required.

## Workflow

Upload TXT/CSV coordinate file -> analyze profile -> view reconstructed graph -> inspect features -> review decision/confidence/explainability -> view trends -> manage operator overrides and database records.
