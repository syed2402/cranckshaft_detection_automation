# Crankshaft Profile Decision Intelligence System (Pilot V1)

Local web-based engineering decision support system for crankshaft crowning/profile evaluation.

## Backend Setup

```bash
cd backend
pip install fastapi uvicorn numpy scipy python-multipart
python main.py
```

Backend runs on `http://localhost:8765` by default. Set `PORT=8000` if port 8000 is available.

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Workflow

Upload TXT/CSV coordinate file -> analyze profile -> view reconstructed graph -> inspect features -> review decision/confidence/explainability -> view trends -> manage operator overrides and database records.

## Input Format

TXT or CSV with one profile per file:

```csv
X,Y
0.0,337.392
0.1,337.393
0.2,337.395
```

Comma or tab separated files are supported. X values must be monotonically increasing and at least 50 coordinate points are required.
