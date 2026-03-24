import React, { useState } from 'react';
import { db, handleFirestoreError, OperationType, collection, query, where, getDocs, addDoc } from '../firebase';
import { Search, Save, User, FileUp } from 'lucide-react';
import Papa from 'papaparse';
import Toast from '../components/Toast';

export default function AdminHealthUpdate() {
  const [indexNumber, setIndexNumber] = useState('');
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ height: '', weight: '', hip: '', waist: '', gripStrength: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const searchStudent = async () => {
    if (!indexNumber) return;
    setLoading(true);
    setStudent(null);
    try {
      const q = query(collection(db, 'users'), where('indexNumber', '==', indexNumber));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setStudent({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setToast({ message: 'Student not found', type: 'error' });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    setSaving(true);
    try {
      const height = parseFloat(formData.height);
      const weight = parseFloat(formData.weight);
      const hip = parseFloat(formData.hip);
      const waist = parseFloat(formData.waist);
      const gripStrength = parseFloat(formData.gripStrength);
      
      const bmi = weight / ((height / 100) ** 2);
      
      let category = 'Normal';
      if (bmi < 18.5) category = 'Underweight';
      else if (bmi >= 25) category = 'Overweight';
      if (bmi >= 30) category = 'Obese';

      // Simple health assessment based on new metrics
      if (waist && hip && (waist / hip > 0.9)) category = 'At Risk (Waist/Hip)';

      await addDoc(collection(db, 'health_records'), {
        userId: student.id,
        height,
        weight,
        bmi,
        hip,
        waist,
        gripStrength,
        category,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      });

      setToast({ message: 'Health data updated successfully!', type: 'success' });
      setFormData({ height: '', weight: '', hip: '', waist: '', gripStrength: '' });
      setStudent(null);
      setIndexNumber('');
    } catch (err) {
      setToast({ message: 'Error updating health data', type: 'error' });
      handleFirestoreError(err, OperationType.CREATE, 'health_records');
    } finally {
      setSaving(false);
    }
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        for (const row of results.data as any[]) {
          if (row.indexNumber && row.height && row.weight) {
            try {
              const q = query(collection(db, 'users'), where('indexNumber', '==', row.indexNumber));
              const snapshot = await getDocs(q);
              if (!snapshot.empty) {
                const studentId = snapshot.docs[0].id;
                const height = parseFloat(row.height);
                const weight = parseFloat(row.weight);
                const hip = parseFloat(row.hip || 0);
                const waist = parseFloat(row.waist || 0);
                const gripStrength = parseFloat(row.gripStrength || 0);
                
                const bmi = weight / ((height / 100) ** 2);
                let category = 'Normal';
                if (bmi < 18.5) category = 'Underweight';
                else if (bmi >= 25) category = 'Overweight';
                if (bmi >= 30) category = 'Obese';
                if (waist && hip && (waist / hip > 0.9)) category = 'At Risk (Waist/Hip)';

                await addDoc(collection(db, 'health_records'), {
                  userId: studentId,
                  height,
                  weight,
                  hip,
                  waist,
                  gripStrength,
                  bmi,
                  category,
                  date: new Date().toISOString().split('T')[0],
                  createdAt: new Date().toISOString()
                });
              }
            } catch (err) {
              console.error('Error importing health data:', err);
            }
          }
        }
        setToast({ message: 'CSV import completed successfully!', type: 'success' });
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Health Data Update</h1>
          <p className="text-slate-500">Update student health metrics</p>
        </div>
        <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 cursor-pointer">
          <FileUp size={18} /> Import
          <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
        </label>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Index Number"
            value={indexNumber}
            onChange={(e) => setIndexNumber(e.target.value)}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button 
            onClick={searchStudent}
            disabled={loading}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            <Search size={18} />
            {loading ? '...' : 'Search'}
          </button>
        </div>

        {student && (
          <div className="p-4 bg-blue-50 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              <User size={24} />
            </div>
            <div>
              <p className="font-bold text-slate-900">{student.fullName}</p>
              <p className="text-sm text-slate-500">Class: {student.class}</p>
            </div>
          </div>
        )}

        {student && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Height (cm)', key: 'height' },
                { label: 'Weight (kg)', key: 'weight' },
                { label: 'Hip (cm)', key: 'hip' },
                { label: 'Waist (cm)', key: 'waist' },
                { label: 'Grip Strength (kg)', key: 'gripStrength' },
              ].map((field) => (
                <div key={field.key} className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">{field.label}</label>
                  <input
                    type="number"
                    required={field.key === 'height' || field.key === 'weight'}
                    value={formData[field.key as keyof typeof formData]}
                    onChange={(e) => setFormData({...formData, [field.key]: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              ))}
            </div>
            <button 
              type="submit"
              disabled={saving}
              className="w-full px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
            >
              <Save size={20} />
              {saving ? 'Updating...' : 'Update Health Data'}
            </button>
          </form>
        )}
      </div>

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}
