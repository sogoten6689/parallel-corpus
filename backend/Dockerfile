FROM python:3.11

WORKDIR /app

# Install Java (required for VnCoreNLP)
RUN apt-get update && apt-get install -y \
    default-jdk \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
# Upgrade build tooling to avoid corrupted wheels
RUN python -m pip install --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r requirements.txt

# Install spaCy English model
RUN python -m spacy download en_core_web_sm

COPY . .

# Copy .env.sample to .env if it doesn't exist
RUN cp .env.sample .env

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
