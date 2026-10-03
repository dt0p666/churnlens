FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency requirements
COPY requirements.txt .

# Install Python packages
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source and models
COPY src/ ./src/
COPY api/ ./api/
COPY models/ ./models/
COPY data/raw/Telco_customer_churn.csv ./data/raw/Telco_customer_churn.csv

EXPOSE 8000

ENV ENVIRONMENT=production
ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
