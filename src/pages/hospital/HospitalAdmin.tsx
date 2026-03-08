import React from 'react';
import { useApp } from '@/context/AppContext';
import { Plus, Minus, AlertTriangle } from 'lucide-react';

export function HospitalAdmin() {
  const { hospitals, updateHospitalRush } = useApp();
  
  // Mock: Assume logged in as staff for Hospital 1
  const myHospital = hospitals[0]; 

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hospital Rush Management</h1>
          <p className="text-slate-500">Managing: {myHospital.name}</p>
        </div>
        <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-lg border border-red-200">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium">Live System Active</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {myHospital.departments.map(dept => (
          <div key={dept.name} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-900">{dept.name}</h3>
              <div className={`flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded ${
                dept.currentPatients > dept.capacity ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}>
                {dept.currentPatients > dept.capacity ? 'Overcrowded' : 'Normal'}
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <div className="text-center">
                  <span className="block text-3xl font-bold text-slate-900">{dept.currentPatients}</span>
                  <span className="text-xs text-slate-500 uppercase font-semibold">Current Patients</span>
                </div>
                
                <div className="text-center">
                  <span className="block text-3xl font-bold text-blue-600">{dept.averageWaitTime}m</span>
                  <span className="text-xs text-slate-500 uppercase font-semibold">Est. Wait Time</span>
                </div>
              </div>

              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    dept.currentPatients > dept.capacity ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(100, (dept.currentPatients / dept.capacity) * 100)}%` }} 
                />
              </div>
              <p className="text-xs text-right text-slate-400">Capacity: {dept.capacity}</p>

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => updateHospitalRush(myHospital.id, dept.name, -1)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center text-slate-700 font-bold transition-colors"
                >
                  <Minus className="h-5 w-5" /> Exit
                </button>
                <button 
                  onClick={() => updateHospitalRush(myHospital.id, dept.name, 1)}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center text-white font-bold transition-colors shadow-md hover:shadow-lg"
                >
                  <Plus className="h-5 w-5" /> Entry
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
