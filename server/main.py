"""
Healthcare Triage System — FastAPI Backend
Serves the trained BERT triage model and handles JWT authentication.
"""

import os
import json
import uuid
import time
from pathlib import Path
from datetime import datetime, timedelta, timezone

import jwt
import bcrypt
import torch
import numpy as np
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from transformers import BertTokenizer, BertForSequenceClassification

# ─── Configuration ───────────────────────────────────────────
MODEL_DIR = os.environ.get(
    "MODEL_DIR",
    os.path.join(os.path.expanduser("~"), "Desktop", "Code", "Claude Code", "AI_Triage_Model", "triage_model")
)

# Resolve to absolute path
MODEL_DIR = str(Path(MODEL_DIR).resolve())

JWT_SECRET = os.environ.get("JWT_SECRET", "mediflow-ai-secret-key-2024")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

USERS_FILE = os.path.join(os.path.dirname(__file__), "users.json")

# Label mappings (must match your training script)
ID2LABEL = {0: "Red", 1: "Orange", 2: "Yellow", 3: "White"}
LABEL_DESC = {
    "Red":    "🔴 Emergency — Immediate attention required",
    "Orange": "🟠 Urgent — See a doctor within 1-2 days",
    "Yellow": "🟡 Semi-urgent — Schedule within 1 week",
    "White":  "⚪ Home care — Rest and self-care recommended",
}

# ─── FastAPI App ─────────────────────────────────────────────
app = FastAPI(title="MediFlow AI — Triage API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Model Loading ───────────────────────────────────────────
print(f"\n{'='*60}")
print(f"  MediFlow AI — Backend Server")
print(f"{'='*60}")
print(f"  Loading model from: {MODEL_DIR}")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

try:
    tokenizer = BertTokenizer.from_pretrained(MODEL_DIR)
    model = BertForSequenceClassification.from_pretrained(MODEL_DIR)
    model = model.to(device)
    model.eval()
    print(f"  ✅ Model loaded successfully on {device}")
except Exception as e:
    print(f"  ❌ Failed to load model: {e}")
    print(f"  ⚠️  Prediction endpoint will return errors")
    tokenizer = None
    model = None

print(f"{'='*60}\n")

# ─── User Storage Helpers ────────────────────────────────────

def load_users() -> list:
    if not os.path.exists(USERS_FILE):
        return []
    with open(USERS_FILE, "r") as f:
        return json.load(f)

def save_users(users: list):
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)

def find_user_by_email(email: str):
    users = load_users()
    for u in users:
        if u["email"].lower() == email.lower():
            return u
    return None

# ─── JWT Helpers ─────────────────────────────────────────────

def create_token(user: dict) -> str:
    payload = {
        "sub": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    token = authorization.split(" ")[1]
    return decode_token(token)

# ─── Request/Response Models ────────────────────────────────

class PredictRequest(BaseModel):
    text: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    role: str  # "patient" | "doctor" | "hospital_staff"

class LoginRequest(BaseModel):
    email: str
    password: str

# ─── Prediction Endpoint ─────────────────────────────────────

@app.post("/api/predict")
async def predict(req: PredictRequest):
    if model is None or tokenizer is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Check server logs.")

    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    start_time = time.time()

    # Tokenize
    encoding = tokenizer(
        req.text,
        max_length=128,
        padding="max_length",
        truncation=True,
        return_tensors="pt"
    )

    # Predict
    with torch.no_grad():
        outputs = model(
            input_ids=encoding["input_ids"].to(device),
            attention_mask=encoding["attention_mask"].to(device),
            token_type_ids=encoding["token_type_ids"].to(device),
        )

    probs = torch.softmax(outputs.logits, dim=1).cpu().numpy()[0]
    pred_id = int(np.argmax(probs))
    pred_label = ID2LABEL[pred_id]
    confidence = float(probs[pred_id])

    inference_time = time.time() - start_time

    return {
        "prediction": pred_label,
        "description": LABEL_DESC[pred_label],
        "confidence": round(confidence * 100, 1),
        "probabilities": {
            ID2LABEL[i]: round(float(p) * 100, 1)
            for i, p in enumerate(probs)
        },
        "inference_time_ms": round(inference_time * 1000, 1),
    }

# ─── Auth Endpoints ──────────────────────────────────────────

@app.post("/api/auth/register")
async def register(req: RegisterRequest):
    # Validate role
    if req.role not in ("patient", "doctor", "hospital_staff"):
        raise HTTPException(status_code=400, detail="Invalid role. Must be: patient, doctor, or hospital_staff")

    # Check if email already exists
    if find_user_by_email(req.email):
        raise HTTPException(status_code=409, detail="Email already registered")

    # Validate password length
    if len(req.password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters")

    # Hash password
    hashed = bcrypt.hashpw(req.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    # Create user
    user = {
        "id": str(uuid.uuid4()),
        "email": req.email.lower(),
        "name": req.name,
        "role": req.role,
        "password_hash": hashed,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    users = load_users()
    users.append(user)
    save_users(users)

    # Return token
    token = create_token(user)
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
        }
    }

@app.post("/api/auth/login")
async def login(req: LoginRequest):
    user = find_user_by_email(req.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Verify password
    if not bcrypt.checkpw(req.password.encode("utf-8"), user["password_hash"].encode("utf-8")):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(user)
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
        }
    }

@app.get("/api/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "user": {
            "id": current_user["sub"],
            "email": current_user["email"],
            "name": current_user["name"],
            "role": current_user["role"],
        }
    }

# ─── Health Check ────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "device": str(device),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
