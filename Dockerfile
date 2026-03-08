# ── Stage 1: Build React Frontend ──────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY src/ ./src/
COPY index.html tsconfig.json vite.config.ts ./
RUN npm run build

# ── Stage 2: Python Backend ───────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies
COPY server/requirements.txt ./server/requirements.txt
RUN pip install --no-cache-dir -r server/requirements.txt

# Copy backend server
COPY server/ ./server/

# Copy frontend build from Stage 1
COPY --from=frontend-builder /app/dist ./dist

# Expose port (Railway sets PORT env var)
EXPOSE ${PORT:-8000}

# Start the FastAPI server
CMD ["python", "-m", "uvicorn", "server.main:app", "--host", "0.0.0.0", "--port", "${PORT:-8000}"]
