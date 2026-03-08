"""
Healthcare Triage System — FastAPI Backend (Production)
Uses MySQL for storage and HuggingFace Spaces for AI predictions.
"""

import os
import uuid
import time
from datetime import datetime, timedelta, timezone

import jwt
import bcrypt
import httpx
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy.orm import Session

from server.database import get_db, init_db
from server.models import User, Prescription, Appointment

# ─── Configuration ───────────────────────────────────────────
JWT_SECRET = os.environ.get("JWT_SECRET", "mediflow-ai-secret-key-2024-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# HuggingFace Spaces URL for the ONNX model
HF_SPACE_URL = os.environ.get(
    "HF_SPACE_URL",
    "https://avi7061-mediflow-triage.hf.space"
)

# Frontend URL for CORS
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

# Label descriptions (used when HF Space returns prediction)
LABEL_DESC = {
    "Red":    "🔴 Emergency — Immediate attention required",
    "Orange": "🟠 Urgent — See a doctor within 1-2 days",
    "Yellow": "🟡 Semi-urgent — Schedule within 1 week",
    "White":  "⚪ Home care — Rest and self-care recommended",
}

# ─── FastAPI App ─────────────────────────────────────────────
app = FastAPI(title="MediFlow AI — Triage API", version="2.0.0")

# CORS — allow frontend origins
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    FRONTEND_URL,
]
# Also allow the Railway domain pattern
if os.environ.get("RAILWAY_PUBLIC_DOMAIN"):
    allowed_origins.append(f"https://{os.environ['RAILWAY_PUBLIC_DOMAIN']}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Startup ─────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    print(f"\n{'='*60}")
    print(f"  MediFlow AI — Backend Server v2.0")
    print(f"{'='*60}")
    print(f"  HF Space URL  : {HF_SPACE_URL}")
    print(f"  Frontend URL   : {FRONTEND_URL}")
    init_db()
    print(f"{'='*60}\n")

# ─── JWT Helpers ─────────────────────────────────────────────

def create_token(user_dict: dict) -> str:
    payload = {
        "sub": user_dict["id"],
        "email": user_dict["email"],
        "name": user_dict["name"],
        "role": user_dict["role"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
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
    role: str

class LoginRequest(BaseModel):
    email: str
    password: str

class PrescriptionCreate(BaseModel):
    patientId: str
    patientName: str
    symptoms: list
    aiSuggestion: str
    triageCategory: str

class PrescriptionVerify(BaseModel):
    notes: str
    status: str  # approved | rejected

class AppointmentCreate(BaseModel):
    hospitalId: str
    departmentName: str
    slot: str

# ─── Prediction Endpoint (calls HuggingFace Space) ───────────

@app.post("/api/predict")
async def predict(req: PredictRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    start_time = time.time()

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{HF_SPACE_URL}/predict",
                json={"text": req.text},
            )

        if response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=f"Model API error: {response.text}"
            )

        result = response.json()
        total_time = (time.time() - start_time) * 1000

        return {
            "prediction": result["prediction"],
            "description": LABEL_DESC.get(result["prediction"], result.get("description", "")),
            "confidence": result["confidence"],
            "probabilities": result["probabilities"],
            "inference_time_ms": round(total_time, 1),
        }
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Cannot connect to model API. The HuggingFace Space may be sleeping — try again in a few seconds."
        )
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Model API timed out. The HuggingFace Space may be cold-starting — try again in 30 seconds."
        )

# ─── Auth Endpoints ──────────────────────────────────────────

@app.post("/api/auth/register")
async def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if req.role not in ("patient", "doctor", "hospital_staff"):
        raise HTTPException(status_code=400, detail="Invalid role")

    existing = db.query(User).filter(User.email == req.email.lower()).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    if len(req.password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters")

    hashed = bcrypt.hashpw(req.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    user = User(
        id=str(uuid.uuid4()),
        email=req.email.lower(),
        name=req.name,
        role=req.role,
        password_hash=hashed,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_token(user.to_dict())
    return {"token": token, "user": user.to_dict()}

@app.post("/api/auth/login")
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not bcrypt.checkpw(req.password.encode("utf-8"), user.password_hash.encode("utf-8")):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(user.to_dict())
    return {"token": token, "user": user.to_dict()}

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

# ─── Prescriptions ───────────────────────────────────────────

@app.get("/api/prescriptions")
async def list_prescriptions(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Prescription)
    if current_user["role"] == "patient":
        query = query.filter(Prescription.patient_id == current_user["sub"])
    # Doctors/hospital see all
    rxs = query.order_by(Prescription.created_at.desc()).all()
    return [rx.to_dict() for rx in rxs]

@app.post("/api/prescriptions")
async def create_prescription(
    req: PrescriptionCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rx = Prescription(
        id=str(uuid.uuid4()),
        patient_id=req.patientId,
        patient_name=req.patientName,
        symptoms=req.symptoms,
        ai_suggestion=req.aiSuggestion,
        triage_category=req.triageCategory,
    )
    db.add(rx)
    db.commit()
    db.refresh(rx)
    return rx.to_dict()

@app.patch("/api/prescriptions/{rx_id}/verify")
async def verify_prescription(
    rx_id: str,
    req: PrescriptionVerify,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user["role"] != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can verify prescriptions")

    rx = db.query(Prescription).filter(Prescription.id == rx_id).first()
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found")

    rx.verified = True
    rx.status = req.status
    rx.doctor_notes = req.notes
    db.commit()
    db.refresh(rx)
    return rx.to_dict()

# ─── Appointments ─────────────────────────────────────────────

@app.get("/api/appointments")
async def list_appointments(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Appointment)
    if current_user["role"] == "patient":
        query = query.filter(Appointment.patient_id == current_user["sub"])
    appts = query.order_by(Appointment.created_at.desc()).all()
    return [a.to_dict() for a in appts]

@app.post("/api/appointments")
async def create_appointment(
    req: AppointmentCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    appt = Appointment(
        id=str(uuid.uuid4()),
        patient_id=current_user["sub"],
        hospital_id=req.hospitalId,
        department_name=req.departmentName,
        slot=req.slot,
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)
    return appt.to_dict()

# ─── Health Check ────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "version": "2.0.0",
        "hf_space": HF_SPACE_URL,
    }

# ─── Serve Static Frontend (Production) ─────────────────────
# In production, the React build output is at ../dist/
dist_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dist")
if os.path.exists(dist_path):
    from starlette.responses import FileResponse

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """Serve React SPA — all non-API routes go to index.html"""
        file_path = os.path.join(dist_path, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(dist_path, "index.html"))

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
