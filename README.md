# 🤖 Automated Drift Monitor

> A production-grade MLOps system that monitors machine learning model health by detecting **data drift** in real time — with explainable AI, statistical drift tests (KS-Test + PSI), and a modern React dashboard.

[![Python](https://img.shields.io/badge/Python-3.8%2B-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.124-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.3-F7931E?logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)

---

## 📌 What Is This?

The **Automated Drift Monitor** detects when a deployed ML model's input data starts to diverge from its training distribution — a phenomenon called **data drift** that silently degrades model accuracy in production.

This project demonstrates:
- **Full MLOps pipeline**: train → serve → monitor → alert
- **Explainable AI (XAI)** with SHAP values per prediction
- **Industry-standard drift metrics**: KS-Test (p-value) and PSI (Population Stability Index)
- **Real-time dashboard** with distribution histograms, alerts, and prediction testing

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     React Frontend                       │
│        (Vite + TypeScript + Recharts + Tailwind)        │
│   ┌──────────────┐ ┌──────────────┐ ┌───────────────┐  │
│   │  Prediction  │ │    Drift     │ │    Model      │  │
│   │   Tester     │ │  Monitoring  │ │     Info      │  │
│   └──────┬───────┘ └──────┬───────┘ └───────┬───────┘  │
└──────────┼────────────────┼─────────────────┼───────────┘
           │                │                 │
           ▼    HTTP/REST   ▼                 ▼
┌─────────────────────────────────────────────────────────┐
│                   FastAPI Backend                        │
│   ┌──────────────┐ ┌──────────────┐ ┌───────────────┐  │
│   │  /predict    │ │ /drift/run   │ │  /model/info  │  │
│   │  + SHAP XAI  │ │ + KS + PSI  │ │  /health      │  │
│   └──────┬───────┘ └──────┬───────┘ └───────────────┘  │
└──────────┼────────────────┼───────────────────────────$─┘
           │                │
           ▼                ▼
┌──────────────┐   ┌────────────────────┐
│  ML Pipeline │   │  Drift Detection   │
│              │   │                    │
│ RandomForest │   │ DriftDetector      │
│  + SHAP      │   │  ├── KS-Test       │
│  + Encoders  │   │  ├── PSI           │
│  + Metadata  │   │  └── Categorical   │
└──────┬───────┘   └────────┬───────────┘
       │                    │
       ▼                    ▼
┌──────────────────────────────────────┐
│      models/   &   reports/          │
│  ├── loan_model.pkl                  │
│  ├── label_encoders.pkl              │
│  ├── baseline_stats.json             │
│  └── drift_reports/*.json            │
└──────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** | REST API framework with auto-generated `/docs` |
| **scikit-learn** | RandomForestClassifier model |
| **SHAP** | Explainable AI — per-prediction feature importance |
| **SciPy** | Kolmogorov-Smirnov statistical drift test |
| **Pandas / NumPy** | Data processing and drift metric computation |
| **Uvicorn** | ASGI production server |

### Frontend
| Technology | Purpose |
|---|---|
| **React 18 + TypeScript** | UI framework |
| **Vite** | Fast dev server + build tool |
| **Recharts** | Distribution histograms, drift charts, SHAP bar graphs |
| **Tailwind CSS** | Utility-first styling |

### MLOps
| Technology | Purpose |
|---|---|
| **KS-Test (p-value)** | Detects if distributions have significantly diverged |
| **PSI (Population Stability Index)** | Quantifies population shift (>0.1 = warning, >0.2 = critical) |
| **SHAP TreeExplainer** | Computes contribution of each feature to each prediction |
| **Concurrently** | Unified `npm run dev` to start both servers |

---

## ⚡ Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- npm 9+

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/automated-drift-monitor.git
cd automated-drift-monitor
```

### 2. Set up the Python environment
```bash
# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Install Node dependencies
```bash
npm run install:all
```

### 4. Train the model (first-time setup)
```bash
python ml_pipeline/train_model.py
```
This generates:
- `models/loan_model.pkl` — trained RandomForest classifier
- `models/label_encoders.pkl` — fitted label encoders
- `models/model_metadata.json` — accuracy, ROC-AUC, feature importance
- `models/baseline_stats.json` — training distribution stats for drift comparison

### 5. Start the full application
```bash
npm run dev
```
This concurrently starts:
- 🔵 **Backend** → [http://localhost:8000](http://localhost:8000)
- 🟢 **Frontend** → [http://localhost:5173](http://localhost:5173)

---

## 🔍 How to Run Drift Checks

### Option A: Via the Dashboard (UI)
1. Open [http://localhost:5173](http://localhost:5173)
2. Navigate to the **Drift Monitoring** tab
3. Upload a CSV file with the same columns as the training data
4. The system will compare distributions and return a drift report

### Option B: Via the API
```bash
# Upload production data and check for drift
curl -X POST http://localhost:8000/drift/run \
  -F "file=@sample_drifted_data.csv"

# View all past drift reports
curl http://localhost:8000/drift/reports

# View latest report only
curl http://localhost:8000/drift/latest
```

### Option C: Via CLI Script
```bash
# Run drift check directly (exits with code 1 if drift detected)
python monitoring/run_drift_check.py --input sample_drifted_data.csv

# Use in CI/CD pipelines — exit code indicates drift status
echo $?   # 0 = no drift, 1 = drift detected
```

---

## 📡 API Reference

Full interactive documentation available at **[http://localhost:8000/docs](http://localhost:8000/docs)** (Swagger UI).

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/model/info` | Model metadata, accuracy, ROC-AUC, feature importance |
| `POST` | `/predict` | Score a loan application + SHAP explanation |
| `POST` | `/drift/run` | Upload production CSV, run KS-Test + PSI drift analysis |
| `GET` | `/drift/reports` | List all past drift reports |
| `GET` | `/drift/reports/{name}` | Fetch a specific report |
| `GET` | `/drift/reports/{name}/download` | Download a report as a JSON attachment |
| `DELETE` | `/drift/reports/{name}` | Delete a specific report |
| `GET` | `/drift/latest` | Get the most recent drift report |
| `GET` | `/drift/history` | Time series of drift scores for trend charts |

Each drift report now includes a severity-weighted `drift_score` (0–1) and,
per feature, a `severity` (`stable`/`warning`/`critical`) plus structured
`metrics` (PSI, KS statistic/p-value, mean-shift σ, or categorical
Jensen-Shannon divergence) — so the UI charts the numbers directly rather than
parsing them out of text. CORS origins are configurable via the
`CORS_ALLOW_ORIGINS` env var.

### Example: Predict Loan Approval
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "Gender": "Male",
    "Married": "Yes",
    "Dependents": "0",
    "Education": "Graduate",
    "Self_Employed": "No",
    "ApplicantIncome": 5000,
    "CoapplicantIncome": 1500,
    "LoanAmount": 120,
    "Loan_Amount_Term": 360,
    "Credit_History": 1.0,
    "Property_Area": "Urban"
  }'
```

**Response:**
```json
{
  "prediction": "Y",
  "probability": 0.7127,
  "shap_explanation": {
    "Credit_History": 0.312,
    "ApplicantIncome": 0.189,
    "LoanAmount": -0.054
  }
}
```

---

## 📊 Drift Detection Metrics

### Kolmogorov-Smirnov Test (Numeric Features)
Tests whether two distributions are drawn from the same population. A **p-value < 0.05** indicates statistically significant drift.

### Population Stability Index (PSI)
Measures the shift in a distribution across 10 bins:

| PSI Score | Interpretation |
|---|---|
| < 0.1 | ✅ Stable — no significant shift |
| 0.1 – 0.2 | ⚠️ Warning — moderate shift detected |
| > 0.2 | 🚨 Critical — major drift, consider retraining |

### Categorical Feature Monitoring
Detects changes in category frequency distribution — e.g., if `Property_Area` shifts from mostly `Urban` to mostly `Rural`.

---

## 📁 Project Structure

```
automated-drift-monitor/
├── backend/                  # FastAPI application
│   ├── main.py               # App entry point, CORS, middleware
│   └── routes.py             # All API endpoint handlers
├── drift_detection/          # Core drift logic
│   ├── drift_detector.py     # KS-Test + PSI implementation
│   └── drift_report.py       # Report generation & storage
├── ml_pipeline/              # Model training
│   └── train_model.py        # Full training pipeline
├── monitoring/               # CLI tools
│   └── run_drift_check.py    # Standalone drift check script
├── frontend/                 # React + Vite + TypeScript
│   └── src/
│       ├── components/       # UI components (Dashboard, Charts, etc.)
│       └── lib/api.ts        # API client
├── models/                   # Trained artifacts (gitignored)
├── data/                     # Training & test datasets
├── configs/                  # Configuration files
├── requirements.txt          # Python dependencies
└── package.json              # Root orchestrator (concurrently)
```

---

## 🧪 Running Tests

```bash
# Run all tests
pytest tests/ -v

# Run with coverage report
pytest tests/ --cov=backend --cov=drift_detection --cov-report=term-missing
```

---

## 🚀 Deployment

The backend can be deployed standalone using Docker (WIP) or any ASGI-compatible host (Railway, Render, Fly.io):

```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

The frontend can be built and served as static files:
```bash
cd frontend && npm run build
```

---

## 📈 Model Performance

| Metric | Value |
|---|---|
| **Accuracy** | 82.9% |
| **ROC-AUC (Test)** | 79.7% |
| **ROC-AUC (5-fold CV)** | 75.6% ± 0.06 |
| **Algorithm** | RandomForestClassifier |
| **Features** | 11 (mix of numeric + categorical) |
| **Training Data** | Loan Prediction Dataset (614 samples) |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.