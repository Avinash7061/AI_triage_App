import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { ClipboardList, Calendar, Activity } from 'lucide-react';

export function PatientDashboard() {
  const { currentUser, appointments, prescriptions } = useApp();

  const myAppointments = appointments.filter(a => a.patientId === currentUser?.id);
  const myPrescriptions = prescriptions.filter(p => p.patientId === currentUser?.id);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          Hello, {currentUser?.name || 'Patient'}
        </h1>
        <Link 
          to="/patient/triage"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition-colors"
        >
          <Activity className="h-4 w-4" />
          Check Symptoms
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Status Card */}
        <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-white shadow-lg">
          <h3 className="mb-2 text-lg font-semibold opacity-90">Current Status</h3>
          <p className="text-3xl font-bold">Stable</p>
          <p className="mt-4 text-sm opacity-75">Last checkup: 2 days ago</p>
        </div>

        {/* Appointments Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Appointments</h3>
            <Calendar className="h-5 w-5 text-slate-400" />
          </div>
          {myAppointments.length > 0 ? (
            <ul className="space-y-3">
              {myAppointments.map(appt => (
                <li key={appt.id} className="flex flex-col text-sm">
                  <span className="font-medium text-slate-700">{appt.departmentName}</span>
                  <span className="text-slate-500">{appt.slot} at Hospital ID: {appt.hospitalId}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No upcoming appointments.</p>
          )}
        </div>

        {/* Recent Prescriptions */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Prescriptions</h3>
            <ClipboardList className="h-5 w-5 text-slate-400" />
          </div>
          {myPrescriptions.length > 0 ? (
            <ul className="space-y-3">
              {myPrescriptions.slice(0, 3).map(rx => (
                <li key={rx.id} className="border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{rx.symptoms[0]}...</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      rx.status === 'approved' ? 'bg-green-100 text-green-700' : 
                      rx.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {rx.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 truncate">{rx.aiSuggestion}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No recent prescriptions.</p>
          )}
        </div>
      </div>
    </div>
  );
}
