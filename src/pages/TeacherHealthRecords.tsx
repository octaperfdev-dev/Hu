import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType, collection, query, where, getDocs, addDoc, orderBy, limit } from '../firebase';
import { Activity, Plus, Search } from 'lucide-react';
import { useAuth } from '../App';
import Toast from '../components/Toast';

export default function TeacherHealthRecords() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterDivision, setFilterDivision] = useState('');
  const [filterHealthLevel, setFilterHealthLevel] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [formData, setFormData] = useState({
    userId: '',
    height: '',
    weight: '',
    hip: '',
    waist: '',
    gripStrength: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    if (user) {
      fetchStudents();
    }
  }, [user]);

  const fetchStudents = async () => {
    try {
      // Fetch students in teacher's class
      const q = query(collection(db, 'users'), where('role', '==', 'student'));
      const querySnapshot = await getDocs(q);
      const studentsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fetch latest health record for each student
      const studentsWithHealth = await Promise.all(studentsData.map(async (student: any) => {
        const healthQ = query(
          collection(db, 'health_records'),
          where('userId', '==', student.id),
          orderBy('date', 'desc'),
          limit(1)
        );
        const healthSnapshot = await getDocs(healthQ);
        let latestBmi = null;
        let healthCategory = 'N/A';
        let latestDate = '';
        
        if (!healthSnapshot.empty) {
          const latestRecord = healthSnapshot.docs[0].data();
          latestBmi = latestRecord.bmi;
          healthCategory = latestRecord.category;
          latestDate = latestRecord.date;
        }

        return {
          ...student,
          latestBmi,
          healthCategory,
          latestDate
        };
      }));

      setStudents(studentsWithHealth as any);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'users/health_records');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const heightInMeters = parseFloat(formData.height) / 100;
      const weightInKg = parseFloat(formData.weight);
      const hip = parseFloat(formData.hip);
      const waist = parseFloat(formData.waist);
      const gripStrength = parseFloat(formData.gripStrength);
      
      const bmi = weightInKg / (heightInMeters * heightInMeters);
      
      let category = 'Normal';
      if (bmi < 18.5) category = 'Underweight';
      else if (bmi >= 25 && bmi < 30) category = 'Overweight';
      else if (bmi >= 30) category = 'Obese';
      if (waist && hip && (waist / hip > 0.9)) category = 'At Risk (Waist/Hip)';

      await addDoc(collection(db, 'health_records'), {
        ...formData,
        height: parseFloat(formData.height),
        weight: weightInKg,
        hip,
        waist,
        gripStrength,
        bmi,
        category,
        createdAt: new Date().toISOString()
      });
      
      setShowAddModal(false);
      setToast({ message: 'Health record saved successfully', type: 'success' });
      setFormData({
        userId: '',
        height: '',
        weight: '',
        hip: '',
        waist: '',
        gripStrength: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      fetchStudents(); // Refresh to get latest BMI
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'health_records');
    }
  };
  const filteredStudents = students.filter((s: any) => {
    const matchesSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = filterClass ? s.class === filterClass : true;
    const matchesGrade = filterGrade ? s.grade === filterGrade : true; // Assuming grade is a field
    const matchesDivision = filterDivision ? s.division === filterDivision : true;
    const matchesHealthLevel = filterHealthLevel ? s.healthCategory === filterHealthLevel : true;
    const matchesDate = filterDate ? s.latestDate === filterDate : true;
    return matchesSearch && matchesClass && matchesGrade && matchesDivision && matchesHealthLevel && matchesDate;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Health Records</h1>
          <p className="text-slate-500 mt-1">Update health measurements for your students</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors"
        >
          <Plus size={20} />
          Add Record
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-64"
            />
          </div>
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="p-2 border border-slate-200 rounded-xl">
            <option value="">All Classes</option>
            {/* Add class options */}
          </select>
          <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} className="p-2 border border-slate-200 rounded-xl">
            <option value="">All Grades</option>
            {/* Add grade options */}
          </select>
          <select value={filterDivision} onChange={e => setFilterDivision(e.target.value)} className="p-2 border border-slate-200 rounded-xl">
            <option value="">All Divisions</option>
            {/* Add division options */}
          </select>
          <select value={filterHealthLevel} onChange={e => setFilterHealthLevel(e.target.value)} className="p-2 border border-slate-200 rounded-xl">
            <option value="">All Health Levels</option>
            <option value="Normal">Normal</option>
            <option value="Underweight">Underweight</option>
            <option value="Overweight">Overweight</option>
            <option value="Obese">Obese</option>
            <option value="At Risk (Waist/Hip)">At Risk (Waist/Hip)</option>
          </select>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="p-2 border border-slate-200 rounded-xl" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                <th className="p-4 font-medium">Student</th>
                <th className="p-4 font-medium">Index Number</th>
                <th className="p-4 font-medium">Latest BMI</th>
                <th className="p-4 font-medium">Health Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student: any) => (
                <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-slate-900">{student.fullName}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">{student.indexNumber || 'N/A'}</td>
                  <td className="p-4 font-mono text-slate-700">
                    {student.latestBmi ? student.latestBmi.toFixed(1) : 'N/A'}
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      student.healthCategory === 'Normal' ? 'bg-emerald-100 text-emerald-700' :
                      student.healthCategory === 'Underweight' ? 'bg-blue-100 text-blue-700' :
                      student.healthCategory === 'Overweight' ? 'bg-orange-100 text-orange-700' :
                      student.healthCategory === 'Obese' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {student.healthCategory}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => {
                        setFormData({ ...formData, userId: student.id });
                        setShowAddModal(true);
                      }}
                      className="text-blue-500 hover:text-blue-700 font-medium text-sm"
                    >
                      Update Record
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-bold mb-4">Add Health Record</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Student</label>
                <select
                  required
                  value={formData.userId}
                  onChange={e => setFormData({...formData, userId: e.target.value})}
                  className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select Student</option>
                  {students.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.fullName}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    value={formData.height}
                    onChange={e => setFormData({...formData, height: e.target.value})}
                    className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    value={formData.weight}
                    onChange={e => setFormData({...formData, weight: e.target.value})}
                    className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                >
                  Save Record
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

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
