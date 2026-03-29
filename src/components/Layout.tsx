import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Activity, LogOut, User } from 'lucide-react';

export function Layout() {
  const { userRole } = useApp();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Determine the role to use for nav display
  const displayRole = user?.role || userRole;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-blue-600">
            <Activity className="h-6 w-6" />
            <span>MediFlow AI</span>
          </Link>

          <nav className="flex items-center gap-6">
            {displayRole === 'patient' && (
              <>
                <Link to="/patient/dashboard" className="text-sm font-medium hover:text-blue-600">Dashboard</Link>
                <Link to="/patient/triage" className="text-sm font-medium hover:text-blue-600">Check Symptoms</Link>
                <Link to="/patient/hospitals" className="text-sm font-medium hover:text-blue-600">Hospitals & Rush</Link>
              </>
            )}
            {displayRole === 'doctor' && (
              <>
                <Link to="/doctor/dashboard" className="text-sm font-medium hover:text-blue-600">Dashboard</Link>
                <Link to="/doctor/history" className="text-sm font-medium hover:text-blue-600">Patient History</Link>
              </>
            )}
            {displayRole === 'hospital_staff' && (
              <>
                <Link to="/hospital/admin" className="text-sm font-medium hover:text-blue-600">Dashboard</Link>
                <Link to="/hospital/patients" className="text-sm font-medium hover:text-blue-600">Patient Records</Link>
                <Link to="/hospital/settings" className="text-sm font-medium hover:text-blue-600">Settings</Link>
              </>
            )}
            
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{user.name}</span>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full capitalize">
                    {user.role === 'hospital_staff' ? 'Hospital' : user.role}
                  </span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  to="/login" 
                  className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
