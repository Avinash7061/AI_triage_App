import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';

// --- Types ---

export type Role = 'patient' | 'doctor' | 'hospital_staff' | null;

export type TriageCategory = 'Red' | 'Orange' | 'Yellow' | 'White';

export interface Department {
  name: string;
  currentPatients: number;
  capacity: number;
  averageWaitTime: number; // minutes
}

export interface Hospital {
  id: string;
  name: string;
  location: string;
  departments: Department[];
  emergencyAvailable: boolean;
  coordinates: { lat: number; lng: number }; // Mock coordinates
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  history: string[];
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  symptoms: string[];
  aiSuggestion: string;
  triageCategory: TriageCategory;
  verified: boolean;
  doctorNotes?: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  hospitalId: string;
  departmentName: string;
  slot: string;
  status: 'booked' | 'completed';
}

// --- Mock Data ---

const INITIAL_HOSPITALS: Hospital[] = [
  {
    id: 'h1',
    name: 'City General Hospital',
    location: 'Central District',
    emergencyAvailable: true,
    coordinates: { lat: 28.6139, lng: 77.2090 },
    departments: [
      { name: 'General Medicine', currentPatients: 45, capacity: 50, averageWaitTime: 45 },
      { name: 'Emergency', currentPatients: 12, capacity: 15, averageWaitTime: 5 },
      { name: 'Pediatrics', currentPatients: 20, capacity: 30, averageWaitTime: 20 },
      { name: 'Orthopedics', currentPatients: 8, capacity: 20, averageWaitTime: 15 },
    ],
  },
  {
    id: 'h2',
    name: 'St. Mary\'s Care',
    location: 'North District',
    emergencyAvailable: false,
    coordinates: { lat: 28.7041, lng: 77.1025 },
    departments: [
      { name: 'General Medicine', currentPatients: 10, capacity: 40, averageWaitTime: 10 },
      { name: 'Dermatology', currentPatients: 5, capacity: 20, averageWaitTime: 5 },
    ],
  },
  {
    id: 'h3',
    name: 'Community Health Center',
    location: 'East District',
    emergencyAvailable: true,
    coordinates: { lat: 28.6219, lng: 77.0878 },
    departments: [
      { name: 'General Medicine', currentPatients: 60, capacity: 50, averageWaitTime: 90 }, // Overcrowded
      { name: 'Emergency', currentPatients: 14, capacity: 10, averageWaitTime: 30 }, // Overcrowded
    ],
  },
];

const INITIAL_PATIENTS: Patient[] = [
  { id: 'p1', name: 'Rahul Sharma', age: 32, gender: 'Male', history: ['Hypertension', 'Mild Asthma'] },
  { id: 'p2', name: 'Priya Singh', age: 28, gender: 'Female', history: ['None'] },
];

const INITIAL_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'rx1',
    patientId: 'p1',
    patientName: 'Rahul Sharma',
    symptoms: ['Mild fever', 'Headache'],
    aiSuggestion: 'Paracetamol 500mg, Rest, Hydration',
    triageCategory: 'Yellow',
    verified: false,
    status: 'pending',
    timestamp: new Date().toISOString(),
  },
];

// --- Context ---

interface AppContextType {
  userRole: Role;
  setUserRole: (role: Role) => void;
  hospitals: Hospital[];
  patients: Patient[];
  prescriptions: Prescription[];
  appointments: Appointment[];
  currentUser: Patient | null; // For simplicity, we just mock one logged in patient
  loginAsPatient: (patientId: string) => void;
  addPrescription: (rx: Omit<Prescription, 'id' | 'timestamp' | 'verified' | 'status'>) => void;
  verifyPrescription: (id: string, notes: string, status: 'approved' | 'rejected') => void;
  updateHospitalRush: (hospitalId: string, departmentName: string, change: number) => void;
  bookAppointment: (hospitalId: string, departmentName: string, slot: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user: authUser } = useAuth();
  
  const [userRole, setUserRole] = useState<Role>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>(INITIAL_HOSPITALS);
  const [patients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(INITIAL_PRESCRIPTIONS);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentUser, setCurrentUser] = useState<Patient | null>(null);

  // Sync auth user with app context
  useEffect(() => {
    if (authUser) {
      setUserRole(authUser.role as Role);
      if (authUser.role === 'patient') {
        // Create a Patient object from the auth user
        setCurrentUser({
          id: authUser.id,
          name: authUser.name,
          age: 30, // Default for demo
          gender: 'Not specified',
          history: [],
        });
      }
    } else {
      setUserRole(null);
      setCurrentUser(null);
    }
  }, [authUser]);

  const loginAsPatient = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      setCurrentUser(patient);
      setUserRole('patient');
    }
  };

  const addPrescription = (rx: Omit<Prescription, 'id' | 'timestamp' | 'verified' | 'status'>) => {
    const newRx: Prescription = {
      ...rx,
      id: Math.random().toString(36).substr(2, 9),
      verified: false,
      status: 'pending',
      timestamp: new Date().toISOString(),
    };
    setPrescriptions(prev => [newRx, ...prev]);
  };

  const verifyPrescription = (id: string, notes: string, status: 'approved' | 'rejected') => {
    setPrescriptions(prev => prev.map(rx => 
      rx.id === id ? { ...rx, verified: true, doctorNotes: notes, status } : rx
    ));
  };

  const updateHospitalRush = (hospitalId: string, departmentName: string, change: number) => {
    setHospitals(prev => prev.map(h => {
      if (h.id !== hospitalId) return h;
      return {
        ...h,
        departments: h.departments.map(d => {
          if (d.name !== departmentName) return d;
          const newCount = Math.max(0, d.currentPatients + change);
          const newWaitTime = Math.ceil(newCount * (d.capacity > 0 ? 50 / d.capacity : 1)); 
          return { ...d, currentPatients: newCount, averageWaitTime: newWaitTime };
        })
      };
    }));
  };

  const bookAppointment = (hospitalId: string, departmentName: string, slot: string) => {
    if (!currentUser) return;
    const newAppt: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      patientId: currentUser.id,
      hospitalId,
      departmentName,
      slot,
      status: 'booked'
    };
    setAppointments(prev => [...prev, newAppt]);
  };

  return (
    <AppContext.Provider value={{
      userRole,
      setUserRole,
      hospitals,
      patients,
      prescriptions,
      appointments,
      currentUser,
      loginAsPatient,
      addPrescription,
      verifyPrescription,
      updateHospitalRush,
      bookAppointment
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
