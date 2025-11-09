# Dockerfile for Render backend deployment
# Uses layer caching to speed up builds - only reinstalls dependencies if requirements.txt changes

FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (needed for some Python packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for better Docker layer caching)
# This layer will be cached unless requirements.txt changes
COPY backend/requirements.txt /app/backend/requirements.txt

# Install Python dependencies
# This layer is cached if requirements.txt hasn't changed
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r backend/requirements.txt

# Copy application code (this changes frequently, so it's a separate layer)
COPY backend /app/backend

# Set working directory to backend
WORKDIR /app/backend

# Expose port (Render sets PORT environment variable)
EXPOSE ${PORT:-8000}

# Start command
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}

