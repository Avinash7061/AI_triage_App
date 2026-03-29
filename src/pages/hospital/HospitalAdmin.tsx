import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getMyHospital,
  addDepartment,
  updateRush,
  deleteDepartment,
} from '@/services/api';
import {
  Plus,
  Minus,
  AlertTriangle,
  Activity,
  Users,
  Clock,
  Building2,
  Trash2,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Department {
  id: string;
  hospitalId: string;
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

export function HospitalAdmin() {
  const navigate = useNavigate();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add department
  const [showAddDept, setShowAddDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCapacity, setNewDeptCapacity] = useState(50);
  const [addingDept, setAddingDept] = useState(false);

  const fetchHospital = useCallback(async () => {
    try {
      const data = await getMyHospital();
      setHospital(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHospital();
  }, [fetchHospital]);

  const handleRush = async (deptId: string, change: number) => {
    try {
      const updated = await updateRush(deptId, change);
      setHospital((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          departments: prev.departments.map((d) =>
            d.id === deptId ? { ...d, ...updated } : d
          ),
        };
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    setAddingDept(true);
    try {
      const dept = await addDepartment({ name: newDeptName, capacity: newDeptCapacity });
      setHospital((prev) => {
        if (!prev) return prev;
        return { ...prev, departments: [...prev.departments, dept] };
      });
      setNewDeptName('');
      setNewDeptCapacity(50);
      setShowAddDept(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAddingDept(false);
    }
  };

  const handleDeleteDept = async (deptId: string, deptName: string) => {
    if (!confirm(`Delete department "${deptName}"?`)) return;
    try {
      await deleteDepartment(deptId);
      setHospital((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          departments: prev.departments.filter((d) => d.id !== deptId),
        };
      });
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

  if (error || !hospital) {
    return (
      <div className="text-center py-20">
        <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <p className="text-red-600 mb-2">{error || 'Hospital not found'}</p>
      </div>
    );
  }

  const totalPatients = hospital.departments.reduce((s, d) => s + d.currentPatients, 0);
  const totalCapacity = hospital.departments.reduce((s, d) => s + d.capacity, 0);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hospital Dashboard</h1>
          <p className="text-slate-500">{hospital.name} — {hospital.location}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchHospital}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-lg border border-red-200">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Live System</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <Building2 className="h-4 w-4" /> Departments
          </div>
          <span className="text-3xl font-bold text-slate-900">{hospital.departments.length}</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <Users className="h-4 w-4" /> Total Patients
          </div>
          <span className="text-3xl font-bold text-slate-900">{totalPatients}</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <Activity className="h-4 w-4" /> Capacity
          </div>
          <span className="text-3xl font-bold text-slate-900">{totalCapacity}</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <Clock className="h-4 w-4" /> Occupancy
          </div>
          <span className={`text-3xl font-bold ${totalPatients > totalCapacity ? 'text-red-600' : 'text-green-600'}`}>
            {totalCapacity > 0 ? Math.round((totalPatients / totalCapacity) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate('/hospital/patients')}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Users className="h-4 w-4 inline mr-2" /> Patient Records
        </button>
        <button
          onClick={() => navigate('/hospital/settings')}
          className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
        >
          Hospital Settings
        </button>
      </div>

      {/* Add Department */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Rush Management</h2>
          <button
            onClick={() => setShowAddDept(!showAddDept)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="h-4 w-4" /> Add Department
          </button>
        </div>

        <AnimatePresence>
          {showAddDept && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAddDepartment}
              className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6 flex flex-wrap gap-4 items-end overflow-hidden"
            >
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-slate-700 mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="e.g. Emergency, Cardiology"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium text-slate-700 mb-1">Capacity</label>
                <input
                  type="number"
                  min={1}
                  value={newDeptCapacity}
                  onChange={(e) => setNewDeptCapacity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={addingDept}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400"
              >
                {addingDept ? 'Adding...' : 'Add'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Departments Grid */}
      {hospital.departments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg">No departments yet</p>
          <p className="text-slate-400 text-sm mt-1">Add your first department to start tracking rush</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {hospital.departments.map((dept) => {
            const loadPercent = dept.capacity > 0 ? (dept.currentPatients / dept.capacity) * 100 : 0;
            const isOver = dept.currentPatients > dept.capacity;
            return (
              <motion.div
                key={dept.id}
                layout
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
              >
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-lg text-slate-900">{dept.name}</h3>
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-full ${
                        isOver ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {isOver ? 'Overcrowded' : 'Normal'}
                    </div>
                    <button
                      onClick={() => handleDeleteDept(dept.id, dept.name)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete department"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  <div className="flex justify-between items-center">
                    <div className="text-center">
                      <span className="block text-3xl font-bold text-slate-900">{dept.currentPatients}</span>
                      <span className="text-xs text-slate-500 uppercase font-semibold">Current</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-3xl font-bold text-blue-600">{dept.averageWaitTime}m</span>
                      <span className="text-xs text-slate-500 uppercase font-semibold">Wait Time</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-3xl font-bold text-slate-400">{dept.capacity}</span>
                      <span className="text-xs text-slate-500 uppercase font-semibold">Capacity</span>
                    </div>
                  </div>

                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${isOver ? 'bg-red-500' : 'bg-blue-500'}`}
                      initial={false}
                      animate={{ width: `${Math.min(100, loadPercent)}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>

                  <div className="flex gap-3 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleRush(dept.id, -1)}
                      disabled={dept.currentPatients === 0}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg flex items-center justify-center text-slate-700 font-bold transition-colors gap-2"
                    >
                      <Minus className="h-5 w-5" /> Patient Exit
                    </button>
                    <button
                      onClick={() => handleRush(dept.id, 1)}
                      className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center text-white font-bold transition-colors shadow-md hover:shadow-lg gap-2"
                    >
                      <Plus className="h-5 w-5" /> Patient Entry
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
