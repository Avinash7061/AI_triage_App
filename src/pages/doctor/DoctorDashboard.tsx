import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Check, X, FileText, User } from 'lucide-react';

export function DoctorDashboard() {
  const { prescriptions, verifyPrescription, patients } = useApp();
  const [selectedHistory, setSelectedHistory] = useState<string | null>(null);

  const pendingPrescriptions = prescriptions.filter(p => p.status === 'pending');

  const handleVerify = (id: string, status: 'approved' | 'rejected') => {
    verifyPrescription(id, status === 'approved' ? 'Approved by Dr.' : 'Rejected, please visit clinic.', status);
  };

  const getPatientHistory = (patientId: string) => {
    return patients.find(p => p.id === patientId)?.history || [];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Doctor Dashboard</h1>
        <div className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
          {pendingPrescriptions.length} Pending Reviews
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {pendingPrescriptions.map(rx => (
          <div key={rx.id} className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50 p-4 flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-500" /> {rx.patientName}
                </h3>
                <p className="text-xs text-slate-500 mt-1">ID: {rx.patientId}</p>
              </div>
              <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                {rx.triageCategory}
              </span>
            </div>

            <div className="flex-1 p-4 space-y-3">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Symptoms</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {rx.symptoms.map(s => (
                    <span key={s} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Suggestion</span>
                <p className="text-sm text-slate-700 bg-blue-50 p-2 rounded mt-1 border border-blue-100">
                  {rx.aiSuggestion}
                </p>
              </div>

              {selectedHistory === rx.patientId ? (
                 <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded">
                   <strong>History:</strong> {getPatientHistory(rx.patientId).join(', ')}
                   <button onClick={() => setSelectedHistory(null)} className="block mt-1 text-blue-600 underline">Close</button>
                 </div>
              ) : (
                <button 
                  onClick={() => setSelectedHistory(rx.patientId)}
                  className="flex items-center text-xs text-blue-600 font-medium hover:underline"
                >
                  <FileText className="h-3 w-3 mr-1" /> View History
                </button>
              )}
            </div>

            <div className="flex border-t border-slate-100">
              <button 
                onClick={() => handleVerify(rx.id, 'rejected')}
                className="flex-1 flex items-center justify-center py-3 text-sm font-medium text-red-600 hover:bg-red-50 border-r border-slate-100 transition-colors"
              >
                <X className="h-4 w-4 mr-1" /> Reject
              </button>
              <button 
                onClick={() => handleVerify(rx.id, 'approved')}
                className="flex-1 flex items-center justify-center py-3 text-sm font-medium text-green-600 hover:bg-green-50 transition-colors"
              >
                <Check className="h-4 w-4 mr-1" /> Approve
              </button>
            </div>
          </div>
        ))}

        {pendingPrescriptions.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No pending prescriptions to verify. Good job!
          </div>
        )}
      </div>
    </div>
  );
}
