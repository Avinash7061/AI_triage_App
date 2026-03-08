/**
 * Centralized API client for the MediFlow AI backend.
 * Handles JWT token attachment and all API calls.
 * API_BASE reads from VITE_API_URL env var for production deployment.
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

// When API_BASE is empty string, API calls go to same origin (production)
// When set to 'http://localhost:8000', calls go to local dev server

// ─── Helper ─────────────────────────────────────────────────

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('mediflow_token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || `API Error ${res.status}`);
  }

  return data;
}

// ─── Auth API ───────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'patient' | 'doctor' | 'hospital_staff';
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export async function apiRegister(
  email: string, password: string, name: string, role: string
): Promise<AuthResponse> {
  return apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name, role }),
  });
}

export async function apiLogin(
  email: string, password: string
): Promise<AuthResponse> {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function apiGetMe(): Promise<{ user: AuthUser }> {
  return apiFetch('/api/auth/me');
}

// ─── Triage Prediction API ──────────────────────────────────

export interface PredictionResult {
  prediction: string;
  description: string;
  confidence: number;
  probabilities: Record<string, number>;
  inference_time_ms: number;
}

export async function apiPredict(text: string): Promise<PredictionResult> {
  return apiFetch('/api/predict', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

// ─── Prescriptions API ──────────────────────────────────────

export async function apiGetPrescriptions() {
  return apiFetch('/api/prescriptions');
}

export async function apiCreatePrescription(data: {
  patientId: string;
  patientName: string;
  symptoms: string[];
  aiSuggestion: string;
  triageCategory: string;
}) {
  return apiFetch('/api/prescriptions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiVerifyPrescription(id: string, notes: string, status: string) {
  return apiFetch(`/api/prescriptions/${id}/verify`, {
    method: 'PATCH',
    body: JSON.stringify({ notes, status }),
  });
}

// ─── Appointments API ───────────────────────────────────────

export async function apiGetAppointments() {
  return apiFetch('/api/appointments');
}

export async function apiCreateAppointment(data: {
  hospitalId: string;
  departmentName: string;
  slot: string;
}) {
  return apiFetch('/api/appointments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Health Check ───────────────────────────────────────────

export async function apiHealth() {
  return apiFetch('/api/health');
}
