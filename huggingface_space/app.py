"""
MediFlow AI — Triage Model API (HuggingFace Spaces)
Serves the ONNX-optimized BERT triage model via FastAPI.
"""

import os
import time
import numpy as np
import onnxruntime as ort
from tokenizers import Tokenizer
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ─── Configuration ───────────────────────────────────────────
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.onnx")
TOKENIZER_PATH = os.path.join(os.path.dirname(__file__), "tokenizer.json")
MAX_LENGTH = 128

ID2LABEL = {0: "Red", 1: "Orange", 2: "Yellow", 3: "White"}
LABEL_DESC = {
    "Red":    "🔴 Emergency — Immediate attention required",
    "Orange": "🟠 Urgent — See a doctor within 1-2 days",
    "Yellow": "🟡 Semi-urgent — Schedule within 1 week",
    "White":  "⚪ Home care — Rest and self-care recommended",
}

# ─── Load Model ──────────────────────────────────────────────
print("Loading ONNX model...")
session = ort.InferenceSession(MODEL_PATH, providers=["CPUExecutionProvider"])
tokenizer = Tokenizer.from_file(TOKENIZER_PATH)
tokenizer.enable_padding(pad_id=0, pad_token="[PAD]", length=MAX_LENGTH)
tokenizer.enable_truncation(max_length=MAX_LENGTH)
print("✅ Model loaded!")

# ─── FastAPI App ─────────────────────────────────────────────
app = FastAPI(title="MediFlow AI — Triage Model", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictRequest(BaseModel):
    text: str

class PredictResponse(BaseModel):
    prediction: str
    description: str
    confidence: float
    probabilities: dict
    inference_time_ms: float

def softmax(x):
    e_x = np.exp(x - np.max(x))
    return e_x / e_x.sum()

@app.post("/predict", response_model=PredictResponse)
async def predict(req: PredictRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    start = time.time()

    # Tokenize
    encoded = tokenizer.encode(req.text)
    input_ids = np.array([encoded.ids], dtype=np.int64)
    attention_mask = np.array([encoded.attention_mask], dtype=np.int64)
    token_type_ids = np.array([encoded.type_ids], dtype=np.int64)

    # Predict
    outputs = session.run(
        None,
        {
            "input_ids": input_ids,
            "attention_mask": attention_mask,
            "token_type_ids": token_type_ids,
        }
    )

    logits = outputs[0][0]
    probs = softmax(logits)
    pred_id = int(np.argmax(probs))
    pred_label = ID2LABEL[pred_id]
    confidence = float(probs[pred_id])
    inference_time = (time.time() - start) * 1000

    return PredictResponse(
        prediction=pred_label,
        description=LABEL_DESC[pred_label],
        confidence=round(confidence * 100, 1),
        probabilities={
            ID2LABEL[i]: round(float(p) * 100, 1)
            for i, p in enumerate(probs)
        },
        inference_time_ms=round(inference_time, 1),
    )

@app.get("/health")
async def health():
    return {"status": "ok", "model": "onnx-bert-triage"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
