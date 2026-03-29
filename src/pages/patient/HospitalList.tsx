import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getHospitals, createAppointment } from '@/services/api';
import { MapPin, Clock, AlertCircle, Loader2, Building2 } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  capacity: number;
  currentPatients: number;
  averageWaitTime: number;
}

interface Hospital {
  id: string;
  name: string;
  location: string;
  emergencyAvailable: boolean;
  departments: Department[];
}

export function HospitalList() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const filter = searchParams.get('filter');

  useEffect(() => {
    getHospitals()
      .then(setHospitals)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredHospitals = hospitals.filter(h => {
    if (filter === 'emergency') return h.emergencyAvailable;
    return true;
  });

  const getRushColor = (waitTime: number) => {
    if (waitTime < 15) return 'text-green-600 bg-green-50';
    if (waitTime < 45) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const handleBook = async (hospitalId: string, deptName: string) => {
    try {
      await createAppointment({
        hospitalId,
        departmentName: deptName,
        slot: '10:00 AM',
      });
      alert('Appointment booked for 10:00 AM!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          {filter === 'emergency' ? 'Nearby Emergency Wards' : 'Find a Hospital'}
        </h1>
        <div className="text-sm text-slate-500">
          Showing {filteredHospitals.length} hospitals
        </div>
      </div>

      {filteredHospitals.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg">No hospitals registered yet</p>
          <p className="text-slate-400 text-sm mt-1">Hospitals will appear here once they register</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredHospitals.map(hospital => (
            <div key={hospital.id} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
              <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{hospital.name}</h3>
                  <div className="flex items-center text-sm text-slate-500 mt-1">
                    <MapPin className="h-3 w-3 mr-1" /> {hospital.location}
                  </div>
                </div>
                {hospital.emergencyAvailable && (
                  <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded uppercase flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" /> ER
                  </span>
                )}
              </div>

              <div className="p-4 space-y-3">
                {hospital.departments.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-2">No departments listed</p>
                ) : (
                  hospital.departments.map(dept => (
                    <div key={dept.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{dept.name}</span>
                      <div className="flex items-center gap-3">
                        <span className={`flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRushColor(dept.averageWaitTime)}`}>
                          <Clock className="h-3 w-3 mr-1" /> {dept.averageWaitTime} min
                        </span>
                        <button 
                          onClick={() => handleBook(hospital.id, dept.name)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-semibold"
                        >
                          Book
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
