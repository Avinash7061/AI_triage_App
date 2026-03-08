# 🏥 MediFlow AI — Healthcare Triage System

An **AI-powered healthcare triage application** that uses a fine-tuned **BERT deep learning model** to classify patient symptoms into urgency levels, enabling faster decision-making and reducing hospital overcrowding.

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green?logo=fastapi)
![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-red?logo=pytorch)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1-blue?logo=tailwindcss)

---

## 🌟 Features

### 🤖 AI-Powered Triage
- Fine-tuned **BERT (Bidirectional Encoder Representations from Transformers)** model for medical symptom classification
- Real-time inference with confidence scores and probability distributions
- **4-level triage classification:**
  - 🔴 **Red — Emergency:** Immediate attention required
  - 🟠 **Orange — Urgent:** See a doctor within 1–2 days
  - 🟡 **Yellow — Semi-urgent:** Schedule within 1 week
  - ⚪ **White — Home Care:** Rest and self-care recommended

### 👥 Multi-Role System
- **Patients** — Check symptoms via AI, view triage results, find nearby hospitals
- **Doctors** — Review AI-generated prescriptions, verify and approve patient cases
- **Hospital Admins** — Monitor hospital rush status and manage departments

### 🔐 Secure Authentication
- JWT-based authentication with role-based access control
- Bcrypt password hashing
- Protected routes per user role

### 💡 Modern UI/UX
- Responsive design with Tailwind CSS
- Smooth animations with Framer Motion
- Clean, medical-grade interface with Lucide icons

---

## 🏗️ Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| **Frontend** | React 19, TypeScript, Vite          |
| **Styling**  | Tailwind CSS 4.1, Framer Motion     |
| **Backend**  | FastAPI, Uvicorn                    |
| **AI Model** | BERT (HuggingFace Transformers), PyTorch |
| **Auth**     | JWT (PyJWT), Bcrypt                 |
| **Icons**    | Lucide React                        |

---

## 📁 Project Structure

```
AI_triage_App/
├── index.html                  # Entry point
├── package.json                # Frontend dependencies
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
├── server/
│   ├── main.py                 # FastAPI backend (model serving + auth)
│   ├── requirements.txt        # Python dependencies
│   └── users.json              # User storage (JSON-based)
└── src/
    ├── main.tsx                # React entry
    ├── App.tsx                 # Routes & app structure
    ├── index.css               # Global styles
    ├── components/
    │   ├── Layout.tsx          # App layout wrapper
    │   └── ProtectedRoute.tsx  # Role-based route guard
    ├── context/
    │   ├── AuthContext.tsx      # Authentication state
    │   └── AppContext.tsx       # Application state
    ├── pages/
    │   ├── Landing.tsx         # Landing page with role selection
    │   ├── auth/
    │   │   ├── LoginPage.tsx   # Login form
    │   │   └── RegisterPage.tsx # Registration form
    │   ├── patient/
    │   │   ├── PatientDashboard.tsx  # Patient home
    │   │   ├── SymptomChecker.tsx    # AI symptom analysis
    │   │   ├── TriageResult.tsx      # Triage results display
    │   │   └── HospitalList.tsx      # Nearby hospitals
    │   ├── doctor/
    │   │   └── DoctorDashboard.tsx   # Doctor review panel
    │   └── hospital/
    │       └── HospitalAdmin.tsx     # Hospital admin panel
    ├── services/
    │   └── api.ts              # API client (backend calls)
    └── utils/
        └── cn.ts               # Tailwind class merge utility
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **Python** ≥ 3.10
- **Trained BERT triage model** (saved via HuggingFace `save_pretrained()`)

### 1. Clone the Repository

```bash
git clone https://github.com/Avinash7061/AI_triage_App.git
cd AI_triage_App
```

### 2. Setup Frontend

```bash
npm install
npm run dev
```

The frontend will run at `http://localhost:5173`.

### 3. Setup Backend

```bash
cd server
pip install -r requirements.txt
```

Set the model directory (default: `~/Desktop/Code/Claude Code/AI_Triage_Model/triage_model`):

```bash
export MODEL_DIR="/path/to/your/triage_model"
```

Start the backend server:

```bash
python main.py
```

The API will run at `http://localhost:8000`.

---

## 🔌 API Endpoints

| Method | Endpoint             | Description                     | Auth Required |
|--------|----------------------|---------------------------------|---------------|
| POST   | `/api/predict`       | Predict triage level from text  | No            |
| POST   | `/api/auth/register` | Register a new user             | No            |
| POST   | `/api/auth/login`    | Login and receive JWT token     | No            |
| GET    | `/api/auth/me`       | Get current user info           | Yes (Bearer)  |
| GET    | `/api/health`        | Health check + model status     | No            |

---

## 🧠 How the AI Triage Works

1. **Patient selects symptoms** from a pre-defined list or types a free-text description
2. Symptoms are sent to the **FastAPI backend**
3. The text is tokenized and passed through the **fine-tuned BERT model**
4. The model outputs **probabilities for 4 triage categories**
5. The highest-confidence category is returned with:
   - Triage level (Red/Orange/Yellow/White)
   - Confidence percentage
   - Full probability distribution
   - Inference time

---

## 📸 Triage Categories

| Category | Level        | Action                              |
|----------|--------------|-------------------------------------|
| 🔴 Red   | Emergency    | Go to nearest ER immediately        |
| 🟠 Orange | Urgent       | Visit a doctor within 24–48 hours   |
| 🟡 Yellow | Semi-urgent  | AI generates prescription for review|
| ⚪ White  | Home Care    | Rest, hydrate, and self-care        |

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👨‍💻 Author

**Avinash Kumar Jha**  
GitHub: [@Avinash7061](https://github.com/Avinash7061)
