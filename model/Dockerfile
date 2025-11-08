# Dockerfile for SageMaker GPU Inference
# Based on PyTorch GPU image for SageMaker

FROM 763104351884.dkr.ecr.us-east-1.amazonaws.com/pytorch-inference:2.0.1-gpu-py310-cu118-ubuntu20.04-sagemaker

# Set working directory
WORKDIR /opt/ml/model

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir \
    torch==2.0.1 \
    torchvision==0.15.2 \
    torchaudio==2.0.2 \
    fair-esm \
    biopython \
    requests \
    flask \
    gunicorn \
    numpy \
    scikit-learn \
    pandas \
    tqdm

# Copy model files
COPY model.pth /opt/ml/model/
COPY embeddings_cache.pkl /opt/ml/model/
COPY ml_service.py /opt/ml/model/

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV MODEL_SERVER_WORKERS=1
ENV MODEL_SERVER_TIMEOUT=60

# Expose port
EXPOSE 8080

# Set the Python path
ENV PYTHONPATH=/opt/ml/model:$PYTHONPATH

# Run the inference server
CMD ["python", "/opt/ml/model/ml_service.py", "--model_dir", "/opt/ml/model", "--port", "8080"]

