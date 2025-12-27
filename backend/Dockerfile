FROM node:18-slim

# Install Python and build dependencies for ML libraries
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy ML requirements and install them (since controller spawns python)
COPY ml_models/requirements.txt ./ml_requirements.txt
# Create virtual environment or install globally (system package is risky in docker, but safest for spawn if env is propagated)
# We will use --break-system-packages for this specific docker use case, or just pip install
RUN pip3 install --no-cache-dir -r ml_requirements.txt --break-system-packages

COPY . .

EXPOSE 4000

CMD ["node", "src/server.js"]
