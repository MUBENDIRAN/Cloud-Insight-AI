# Cloud Insight AI - Docker Container
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies (if needed in future)
RUN apt-get update && apt-get install -y \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY data/ ./data/
COPY src/ ./src/

# Set Python path and environment
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/src

# Run the analyzer
CMD ["python", "src/analyzer.py"]