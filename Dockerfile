# Dockerfile
# ──────────────────────────────────────────────────────────────────────────────
# Production Docker image for the Automated Drift Monitor FastAPI backend.
#
# Build:
#   docker build -t drift-monitor-backend .
#
# Run:
#   docker run -p 8000:8000 drift-monitor-backend
#
# The trained model artifacts (models/) must exist before building.
# Run `python ml_pipeline/train_model.py` first if they don't.
# ──────────────────────────────────────────────────────────────────────────────

FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Set working directory
WORKDIR /app

# Install system dependencies needed by some Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies first (layer-cache friendly)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY backend/         ./backend/
COPY drift_detection/ ./drift_detection/
COPY ml_pipeline/     ./ml_pipeline/
COPY configs/         ./configs/

# Copy trained model artifacts (must be present before building)
COPY models/          ./models/

# Copy training data (needed by DriftDetector for baseline category distributions)
COPY data/raw/        ./data/raw/

# Create runtime directories
RUN mkdir -p logs/drift_reports data/production

# Expose the API port
EXPOSE 8000

# Health-check so orchestrators know when the app is ready
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Start the FastAPI application with Uvicorn
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
