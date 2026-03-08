---
title: MediFlow AI Triage Model
emoji: 🏥
colorFrom: blue
colorTo: red
sdk: docker
app_port: 7860
pinned: false
---

# MediFlow AI — Triage Model API

ONNX-optimized BERT model for medical triage classification.

## API Usage

```bash
curl -X POST https://<your-space>.hf.space/predict \
  -H "Content-Type: application/json" \
  -d '{"text": "severe chest pain and difficulty breathing"}'
```

## Categories

| Category | Description |
|----------|-------------|
| 🔴 Red | Emergency — Immediate attention |
| 🟠 Orange | Urgent — See doctor within 1-2 days |
| 🟡 Yellow | Semi-urgent — Schedule within 1 week |
| ⚪ White | Home care — Rest and self-care |
