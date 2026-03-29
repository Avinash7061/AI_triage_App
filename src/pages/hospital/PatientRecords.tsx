import React, { useState, useEffect, useCallback } from 'react';
import {
  getPatientRecords,
  admitPatient,
  updatePatientRecord,
  getMyHospital,
} from '@/services/api';
import {
  Users,
  Plus,
  Search,
  Loader2,
  UserPlus,
  FileText,
  X,
  CheckCircle,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PatientRecord {
  id: string;
  patientName: string;
  age: number | null;
  gender: string | null;
  symptoms: string[];
  triageCategory: string | null;
  roomNumber: string | null;
  departmentId: string | null;
  status: string;
  notes: string | null;
  admittedAt: string | null;
  dischargedAt: string | null;
}

interface Department {
  id: string;
  name: string;
}

const TRIAGE_COLORS: Record<string, string> = {
  Red: 'bg-red-100 text-red-700 border-red-200',
  Orange: 'bg-orange-100 text-orange-700 border-orange-200',
  Yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  White: 'bg-slate-100 text-slate-700 border-slate-200',
};

export function PatientRecords() {
  const [records, setRecords] = useState<PatientRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('admitted');
  const [search, setSearch] = useState('');
  const [showAdmitForm, setShowAdmitForm] = useState(false);

  // Admit form state
  const [form, setForm] = useState({
    patientName: '',
    age: '',
    gender: '',
    symptoms: '',
    triageCategory: 'Yellow',
    roomNumber: '',
    departmentId: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [recs, hosp] = await Promise.all([
        getPatientRecords(filter || undefined),
        getMyHospital(),
      ]);
      setRecords(recs);
      setDepartments(hosp.departments || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientName.trim()) return;
    setSubmitting(true);
    try {
      const newRecord = await admitPatient({
        patientName: form.patientName,
        age: form.age ? parseInt(form.age) : undefined,
        gender: form.gender || undefined,
        symptoms: form.symptoms ? form.symptoms.split(',').map((s) => s.trim()) : undefined,
        triageCategory: form.triageCategory || undefined,
        roomNumber: form.roomNumber || undefined,
        departmentId: form.departmentId || undefined,
        notes: form.notes || undefined,
      });
      setRecords((prev) => [newRecord, ...prev]);
      setForm({
        patientName: '',
        age: '',
        gender: '',
        symptoms: '',
        triageCategory: 'Yellow',
        roomNumber: '',
        departmentId: '',
        notes: '',
      });
      setShowAdmitForm(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDischarge = async (recordId: string) => {
    if (!confirm('Discharge this patient?')) return;
    try {
      const updated = await updatePatientRecord(recordId, { status: 'discharged' });
      setRecords((prev) => prev.map((r) => (r.id === recordId ? updated : r)));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTransfer = async (recordId: string) => {
    if (!confirm('Mark this patient as transferred?')) return;
    try {
      const updated = await updatePatientRecord(recordId, { status: 'transferred' });
      setRecords((prev) => prev.map((r) => (r.id === recordId ? updated : r)));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredRecords = records.filter((r) =>
    r.patientName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patient Records</h1>
          <p className="text-slate-500">Manage admitted, discharged, and transferred patients</p>
        </div>
        <button
          onClick={() => setShowAdmitForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <UserPlus className="h-4 w-4" /> Admit Patient
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {['admitted', 'discharged', 'transferred', ''].map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setLoading(true); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                filter === f ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f ? f.charAt(0).toUpperCase() + f.slice(1) : 'All'}
            </button>
          ))}
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patients..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
          />
        </div>
      </div>

      {/* Admit Patient Modal */}
      <AnimatePresence>
        {showAdmitForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowAdmitForm(false)}
          >
            <motion.form
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onSubmit={handleAdmit}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-slate-900">Admit New Patient</h2>
                <button type="button" onClick={() => setShowAdmitForm(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Patient Name *</label>
                  <input
                    type="text"
                    required
                    value={form.patientName}
                    onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    min={0}
                    max={150}
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    placeholder="35"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Symptoms (comma-separated)</label>
                  <input
                    type="text"
                    value={form.symptoms}
                    onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
                    placeholder="Chest pain, fever, cough"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Triage Category</label>
                  <select
                    value={form.triageCategory}
                    onChange={(e) => setForm({ ...form, triageCategory: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Red">🔴 Red — Emergency</option>
                    <option value="Orange">🟠 Orange — Urgent</option>
                    <option value="Yellow">🟡 Yellow — Semi-urgent</option>
                    <option value="White">⚪ White — Non-urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Room Number</label>
                  <input
                    type="text"
                    value={form.roomNumber}
                    onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                    placeholder="Room 201"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                  <select
                    value={form.departmentId}
                    onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Additional notes..."
                    rows={2}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
              >
                {submitting ? 'Admitting...' : 'Admit Patient'}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Records Table */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg">No patient records found</p>
          <p className="text-slate-400 text-sm mt-1">
            {filter ? `No ${filter} patients` : 'Admit a patient to get started'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold">Patient</th>
                  <th className="text-left px-5 py-3 font-semibold">Age/Gender</th>
                  <th className="text-left px-5 py-3 font-semibold">Triage</th>
                  <th className="text-left px-5 py-3 font-semibold">Room</th>
                  <th className="text-left px-5 py-3 font-semibold">Status</th>
                  <th className="text-left px-5 py-3 font-semibold">Admitted</th>
                  <th className="text-right px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-900">{rec.patientName}</div>
                      {rec.symptoms && rec.symptoms.length > 0 && (
                        <div className="text-xs text-slate-500 mt-0.5">{rec.symptoms.join(', ')}</div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {rec.age ? `${rec.age}y` : '—'} {rec.gender ? `/ ${rec.gender}` : ''}
                    </td>
                    <td className="px-5 py-4">
                      {rec.triageCategory && (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${TRIAGE_COLORS[rec.triageCategory] || TRIAGE_COLORS.White}`}>
                          {rec.triageCategory}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{rec.roomNumber || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        rec.status === 'admitted' ? 'bg-green-100 text-green-700' :
                        rec.status === 'discharged' ? 'bg-slate-100 text-slate-600' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs">
                      {rec.admittedAt
                        ? new Date(rec.admittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {rec.status === 'admitted' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDischarge(rec.id)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Discharge"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleTransfer(rec.id)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Transfer"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
