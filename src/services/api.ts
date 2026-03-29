/**
 * API client for MediFlow AI backend
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || 'Request failed');
  }
  return res.json();
}

// ─── Auth ──────────────────────────────────────────────────

export async function register(data: {
  email: string;
  password: string;
  name: string;
  role: string;
  hospitalName?: string;
  hospitalLocation?: string;
}) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

export async function getMe() {
  const res = await fetch(`${API_BASE}/api/auth/me`, { headers: getHeaders() });
  return handleResponse(res);
}

// ─── Predictions ────────────────────────────────────────────

export async function predict(text: string) {
  const res = await fetch(`${API_BASE}/api/predict`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ text }),
  });
  return handleResponse(res);
}

// ─── Hospitals (Public) ─────────────────────────────────────

export async function getHospitals() {
  const res = await fetch(`${API_BASE}/api/hospitals`, { headers: getHeaders() });
  return handleResponse(res);
}

// ─── My Hospital (Staff) ────────────────────────────────────

export async function getMyHospital() {
  const res = await fetch(`${API_BASE}/api/hospitals/mine`, { headers: getHeaders() });
  return handleResponse(res);
}

export async function updateMyHospital(data: {
  name?: string;
  location?: string;
  emergencyAvailable?: boolean;
}) {
  const res = await fetch(`${API_BASE}/api/hospitals/mine`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ─── Departments ────────────────────────────────────────────

export async function addDepartment(data: { name: string; capacity: number }) {
  const res = await fetch(`${API_BASE}/api/hospitals/mine/departments`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateRush(departmentId: string, change: number) {
  const res = await fetch(`${API_BASE}/api/departments/${departmentId}/rush`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ change }),
  });
  return handleResponse(res);
}

export async function deleteDepartment(departmentId: string) {
  const res = await fetch(`${API_BASE}/api/departments/${departmentId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleResponse(res);
}

// ─── Patient Records ────────────────────────────────────────

export async function getPatientRecords(status?: string) {
  const params = status ? `?status=${status}` : '';
  const res = await fetch(`${API_BASE}/api/patient-records${params}`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function admitPatient(data: {
  patientName: string;
  age?: number;
  gender?: string;
  symptoms?: string[];
  triageCategory?: string;
  roomNumber?: string;
  departmentId?: string;
  notes?: string;
}) {
  const res = await fetch(`${API_BASE}/api/patient-records`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updatePatientRecord(
  recordId: string,
  data: {
    status?: string;
    roomNumber?: string;
    notes?: string;
    departmentId?: string;
    triageCategory?: string;
  }
) {
  const res = await fetch(`${API_BASE}/api/patient-records/${recordId}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ─── Prescriptions ──────────────────────────────────────────

export async function getPrescriptions() {
  const res = await fetch(`${API_BASE}/api/prescriptions`, { headers: getHeaders() });
  return handleResponse(res);
}

export async function createPrescription(data: {
  patientId: string;
  patientName: string;
  symptoms: string[];
  aiSuggestion: string;
  triageCategory: string;
}) {
  const res = await fetch(`${API_BASE}/api/prescriptions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function verifyPrescription(rxId: string, data: { notes: string; status: string }) {
  const res = await fetch(`${API_BASE}/api/prescriptions/${rxId}/verify`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ─── Appointments ───────────────────────────────────────────

export async function getAppointments() {
  const res = await fetch(`${API_BASE}/api/appointments`, { headers: getHeaders() });
  return handleResponse(res);
}

export async function createAppointment(data: {
  hospitalId: string;
  departmentName: string;
  slot: string;
}) {
  const res = await fetch(`${API_BASE}/api/appointments`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}
