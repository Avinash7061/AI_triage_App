import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ArrowRight, User, Stethoscope, Building2, Shield, Zap, Brain } from 'lucide-react';
import { motion } from 'framer-motion';

export function Landing() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to their dashboard
  if (isAuthenticated && user) {
    const routes: Record<string, string> = {
      patient: '/patient/dashboard',
      doctor: '/doctor/dashboard',
      hospital_staff: '/hospital/admin',
    };
    return <Navigate to={routes[user.role] || '/'} replace />;
  }

  const handleRoleSelect = (role: string) => {
    navigate(`/login?role=${role}`);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-16 py-16 text-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 max-w-3xl"
      >
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-2 rounded-full border border-blue-100">
          <Brain className="h-4 w-4" />
          Powered by BERT AI Model
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
          Healthcare <span className="text-blue-600">Triage & Management</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          AI-powered triage using a trained BERT deep learning model, real-time hospital rush tracking, 
          and seamless doctor-patient connectivity. Reducing overcrowding and saving lives.
        </p>
      </motion.div>

      {/* Feature highlights */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap justify-center gap-6 max-w-3xl"
      >
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Shield className="h-5 w-5 text-green-500" />
          <span>Secure Authentication</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Zap className="h-5 w-5 text-yellow-500" />
          <span>Real-time AI Triage</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Brain className="h-5 w-5 text-purple-500" />
          <span>BERT Deep Learning</span>
        </div>
      </motion.div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 w-full max-w-4xl px-4">
        <RoleCard 
          title="Patient" 
          icon={<User className="h-8 w-8 text-blue-500" />}
          description="Check symptoms, get AI triage, and find hospitals."
          onClick={() => handleRoleSelect('patient')}
        />
        <RoleCard 
          title="Doctor" 
          icon={<Stethoscope className="h-8 w-8 text-green-500" />}
          description="Verify prescriptions and view patient history."
          onClick={() => handleRoleSelect('doctor')}
        />
        <RoleCard 
          title="Hospital Admin" 
          icon={<Building2 className="h-8 w-8 text-purple-500" />}
          description="Manage hospital rush and department status."
          onClick={() => handleRoleSelect('hospital_staff')}
        />
      </div>
    </div>
  );
}

function RoleCard({ title, icon, description, onClick }: { title: string, icon: React.ReactNode, description: string, onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg transition-all hover:border-blue-200 hover:shadow-blue-50"
    >
      <div className="mb-4 rounded-full bg-slate-50 p-4 ring-1 ring-slate-100">
        {icon}
      </div>
      <h3 className="mb-2 text-xl font-semibold text-slate-900">{title}</h3>
      <p className="mb-6 text-sm text-slate-500">{description}</p>
      <div className="flex items-center text-sm font-medium text-blue-600">
        Get Started <ArrowRight className="ml-1 h-4 w-4" />
      </div>
    </motion.button>
  );
}
