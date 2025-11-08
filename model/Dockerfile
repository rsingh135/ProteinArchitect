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

# Copy model service code
COPY ml_service.py /opt/ml/model/

# Model files (model.pth and embeddings_cache.pkl) will be provided by SageMaker
# They should be uploaded to S3 and specified in the SageMaker model configuration
# The ml_service.py will load them from /opt/ml/model/ directory

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

