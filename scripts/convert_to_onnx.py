"""
ONNX Conversion Script — Convert BERT Triage Model to ONNX + INT8 Quantization

Run from the project root:
    python3 scripts/convert_to_onnx.py

This will:
1. Load the trained PyTorch BERT model (~438MB)
2. Export to ONNX format (~170MB)
3. Apply INT8 dynamic quantization (~45MB)
4. Save to onnx_model/ directory
"""

import os
import sys
import shutil
from pathlib import Path

# ─── Configuration ───────────────────────────────────────────
MODEL_DIR = os.path.join(
    os.path.expanduser("~"),
    "Desktop", "Code", "Claude Code", "AI_Triage_Model", "triage_model"
)
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "onnx_model")

print(f"\n{'='*60}")
print(f"  BERT → ONNX Conversion")
print(f"{'='*60}")
print(f"  Source : {MODEL_DIR}")
print(f"  Output : {OUTPUT_DIR}")

# ─── Step 1: Load PyTorch Model ──────────────────────────────
print(f"\n📥 Step 1: Loading PyTorch model...")

import torch
from transformers import BertTokenizer, BertForSequenceClassification

tokenizer = BertTokenizer.from_pretrained(MODEL_DIR)
model = BertForSequenceClassification.from_pretrained(MODEL_DIR)
model.eval()

print(f"  ✅ Model loaded ({sum(p.numel() for p in model.parameters()):,} parameters)")

# ─── Step 2: Export to ONNX ──────────────────────────────────
print(f"\n📦 Step 2: Exporting to ONNX...")

os.makedirs(OUTPUT_DIR, exist_ok=True)
onnx_path = os.path.join(OUTPUT_DIR, "model.onnx")

# Create dummy input
dummy_text = "Patient has chest pain and difficulty breathing"
inputs = tokenizer(
    dummy_text,
    max_length=128,
    padding="max_length",
    truncation=True,
    return_tensors="pt"
)

# Export
torch.onnx.export(
    model,
    (inputs["input_ids"], inputs["attention_mask"], inputs["token_type_ids"]),
    onnx_path,
    input_names=["input_ids", "attention_mask", "token_type_ids"],
    output_names=["logits"],
    dynamic_axes={
        "input_ids": {0: "batch", 1: "sequence"},
        "attention_mask": {0: "batch", 1: "sequence"},
        "token_type_ids": {0: "batch", 1: "sequence"},
        "logits": {0: "batch"},
    },
    opset_version=14,
    do_constant_folding=True,
)

onnx_size = os.path.getsize(onnx_path) / (1024 * 1024)
print(f"  ✅ Exported: {onnx_path} ({onnx_size:.1f} MB)")

# ─── Step 3: Quantize to INT8 ────────────────────────────────
print(f"\n⚡ Step 3: Quantizing to INT8...")

from onnxruntime.quantization import quantize_dynamic, QuantType

quantized_path = os.path.join(OUTPUT_DIR, "model_quantized.onnx")

quantize_dynamic(
    model_input=onnx_path,
    model_output=quantized_path,
    weight_type=QuantType.QUInt8,
)

quantized_size = os.path.getsize(quantized_path) / (1024 * 1024)
print(f"  ✅ Quantized: {quantized_path} ({quantized_size:.1f} MB)")
print(f"  📉 Size reduction: {onnx_size:.1f} MB → {quantized_size:.1f} MB ({(1 - quantized_size/onnx_size)*100:.0f}% smaller)")

# Remove unquantized version to save space
os.remove(onnx_path)
os.rename(quantized_path, onnx_path)
print(f"  ✅ Renamed quantized model to model.onnx")

# ─── Step 4: Copy Tokenizer Files ────────────────────────────
print(f"\n📋 Step 4: Copying tokenizer files...")

for fname in ["tokenizer.json", "tokenizer_config.json"]:
    src = os.path.join(MODEL_DIR, fname)
    dst = os.path.join(OUTPUT_DIR, fname)
    if os.path.exists(src):
        shutil.copy2(src, dst)
        print(f"  ✅ Copied {fname}")

# ─── Step 5: Verify ──────────────────────────────────────────
print(f"\n🧪 Step 5: Verifying ONNX model...")

import onnxruntime as ort
import numpy as np

session = ort.InferenceSession(os.path.join(OUTPUT_DIR, "model.onnx"))

# Run test prediction
test_text = "severe chest pain radiating to left arm, sweating"
test_inputs = tokenizer(test_text, max_length=128, padding="max_length", truncation=True, return_tensors="np")

outputs = session.run(
    None,
    {
        "input_ids": test_inputs["input_ids"],
        "attention_mask": test_inputs["attention_mask"],
        "token_type_ids": test_inputs["token_type_ids"],
    }
)

logits = outputs[0][0]
probs = np.exp(logits) / np.sum(np.exp(logits))  # softmax
ID2LABEL = {0: "Red", 1: "Orange", 2: "Yellow", 3: "White"}
pred_id = int(np.argmax(probs))

print(f"  Test: '{test_text}'")
print(f"  Prediction: {ID2LABEL[pred_id]} ({probs[pred_id]*100:.1f}%)")
for i, p in enumerate(probs):
    print(f"    {ID2LABEL[i]}: {p*100:.1f}%")

# ─── Done ─────────────────────────────────────────────────────
final_size = os.path.getsize(os.path.join(OUTPUT_DIR, "model.onnx")) / (1024 * 1024)
print(f"\n{'='*60}")
print(f"  ✅ ONNX conversion complete!")
print(f"  📁 Output: {OUTPUT_DIR}/")
print(f"  📦 Final size: {final_size:.1f} MB")
print(f"{'='*60}\n")
