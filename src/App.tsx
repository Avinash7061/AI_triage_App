import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import { AuthProvider } from '@/context/AuthContext';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Landing } from '@/pages/Landing';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { PatientDashboard } from '@/pages/patient/PatientDashboard';
import { SymptomChecker } from '@/pages/patient/SymptomChecker';
import { TriageResult } from '@/pages/patient/TriageResult';
import { HospitalList } from '@/pages/patient/HospitalList';
import { DoctorDashboard } from '@/pages/doctor/DoctorDashboard';
import { HospitalAdmin } from '@/pages/hospital/HospitalAdmin';

export function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Landing />} />
              
              {/* Auth Routes */}
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              
              {/* Patient Routes (Protected) */}
              <Route path="patient/dashboard" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <PatientDashboard />
                </ProtectedRoute>
              } />
              <Route path="patient/triage" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <SymptomChecker />
                </ProtectedRoute>
              } />
              <Route path="patient/result" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <TriageResult />
                </ProtectedRoute>
              } />
              <Route path="patient/hospitals" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <HospitalList />
                </ProtectedRoute>
              } />
              
              {/* Doctor Routes (Protected) */}
              <Route path="doctor/dashboard" element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <DoctorDashboard />
                </ProtectedRoute>
              } />
              <Route path="doctor/history" element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <Navigate to="/doctor/dashboard" replace />
                </ProtectedRoute>
              } />
              
              {/* Hospital Routes (Protected) */}
              <Route path="hospital/admin" element={
                <ProtectedRoute allowedRoles={['hospital_staff']}>
                  <HospitalAdmin />
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}
