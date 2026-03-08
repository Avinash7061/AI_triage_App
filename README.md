# MediFlow AI — Healthcare Triage System

AI-powered triage using a trained BERT deep learning model, real-time hospital rush tracking, and seamless doctor-patient connectivity.

## 🏗 Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│  React Frontend │────▶│  FastAPI Backend      │────▶│  HuggingFace Spaces │
│  (Vite + TW)    │     │  (Railway + MySQL)    │     │  (ONNX BERT Model)  │
└─────────────────┘     └──────────────────────┘     └─────────────────────┘
```

## 🚀 Local Development

### 1. Install Dependencies
```bash
npm install                                    # Frontend
pip install -r server/requirements.txt         # Backend
```

### 2. Start the Model Server (Port 7860)
```bash
cd huggingface_space && python3 app.py
```

### 3. Start the Backend (Port 8000)
```bash
python3 -m uvicorn server.main:app --host 0.0.0.0 --port 8000
```

### 4. Start the Frontend (Port 5173)
```bash
npm run dev
```

Open **http://localhost:5173** — register an account and try the triage!

---

## ☁️ Deployment

### Step 1: Deploy Model to HuggingFace Spaces

1. Create a new Space at [huggingface.co/new-space](https://huggingface.co/new-space)
   - SDK: **Docker**
   - Name: `mediflow-triage`
2. Push the `huggingface_space/` folder:
```bash
cd huggingface_space
git init
git remote add origin https://huggingface.co/spaces/YOUR_USERNAME/mediflow-triage
git add .
git commit -m "Initial deploy"
git push -u origin main
```
3. Wait for the Space to build. Note the URL (e.g., `https://YOUR_USERNAME-mediflow-triage.hf.space`)

### Step 2: Deploy to Railway

1. Push this repo to GitHub
2. Create a new project at [railway.app](https://railway.app)
3. Add a **MySQL** plugin to your project
4. Link your GitHub repo
5. Set environment variables:
   - `JWT_SECRET` → a strong random string
   - `HF_SPACE_URL` → your HuggingFace Space URL
   - `VITE_API_URL` → leave **empty** (same-origin in production)
   - `DATABASE_URL` → auto-provided by Railway MySQL plugin

Railway will auto-deploy on every push.

---

## 🔒 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | MySQL connection string | Railway auto-provides |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `HF_SPACE_URL` | HuggingFace Spaces model URL | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | Optional |
| `VITE_API_URL` | Backend URL for frontend | Dev only |
| `PORT` | Server port | Railway auto-provides |

---

## 🧠 Model

- **Architecture**: BERT (bert-base-uncased) fine-tuned for 4-class triage
- **Categories**: 🔴 Red (Emergency) | 🟠 Orange (Urgent) | 🟡 Yellow (Semi-urgent) | ⚪ White (Home care)
- **Format**: ONNX (optimized for CPU inference)
- **Size**: ~418MB (model + weights)

## 👥 User Roles

- **Patient**: Check symptoms, get AI triage, find hospitals
- **Doctor**: View patient prescriptions, verify AI-generated prescriptions
- **Hospital Admin**: Manage department rush and capacity
