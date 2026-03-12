import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType, collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc } from '../firebase';
import { Plus, Search, Edit2, Trash2, Users } from 'lucide-react';
import { useAuth } from '../App';
import Toast from '../components/Toast';

export default function AdminClassrooms() {
  const [classrooms, setClassrooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [formData, setFormData] = useState({
    grade: '',
    division: '',
    teacherId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch Classrooms
      const classSnapshot = await getDocs(collection(db, 'classrooms'));
      const classData = classSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Fetch Teachers
      const teacherQuery = query(collection(db, 'users'), where('role', '==', 'teacher'));
      const teacherSnapshot = await getDocs(teacherQuery);
      const teacherData = teacherSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Fetch Students to get count
      const studentQuery = query(collection(db, 'users'), where('role', '==', 'student'));
      const studentSnapshot = await getDocs(studentQuery);
      const students = studentSnapshot.docs.map(doc => doc.data());

      // Map teacher names and student counts
      const enrichedClassrooms = classData.map((c: any) => {
        const teacher = teacherData.find(t => t.id === c.teacherId);
        const studentCount = students.filter((s: any) => s.class === `${c.grade} ${c.division}`).length;
        return {
          ...c,
          teacherName: teacher ? (teacher as any).fullName : null,
          studentCount
        };
      });

      setClassrooms(enrichedClassrooms as any);
      setTeachers(teacherData as any);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'classrooms/users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClassroom) {
        const classRef = doc(db, 'classrooms', editingClassroom.id);
        await updateDoc(classRef, formData);
      } else {
        await addDoc(collection(db, 'classrooms'), formData);
      }
      
      setShowAddModal(false);
      setEditingClassroom(null);
      setToast({ message: editingClassroom ? 'Classroom updated successfully' : 'Classroom added successfully', type: 'success' });
      setFormData({ grade: '', division: '', teacherId: '' });
      fetchData();
    } catch (error) {
      handleFirestoreError(error, editingClassroom ? OperationType.UPDATE : OperationType.CREATE, 'classrooms');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this classroom?')) return;
    
    try {
      await deleteDoc(doc(db, 'classrooms', id));
      setToast({ message: 'Classroom deleted successfully', type: 'success' });
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `classrooms/${id}`);
    }
  };

  const openEditModal = (classroom: any) => {
    setEditingClassroom(classroom);
    setFormData({
      grade: classroom.grade,
      division: classroom.division,
      teacherId: classroom.teacherId || ''
    });
    setShowAddModal(true);
  };

  const filteredClassrooms = classrooms.filter((c: any) => 
    c.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.division.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.teacherName && c.teacherName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Class & Division Management</h1>
          <p className="text-slate-500 mt-1">Organize students and assign teachers to classes</p>
        </div>
        <button
          onClick={() => {
            setEditingClassroom(null);
            setFormData({ grade: '', division: '', teacherId: '' });
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors"
        >
          <Plus size={20} />
          Add Classroom
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search classrooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                <th className="p-4 font-medium">Class / Grade</th>
                <th className="p-4 font-medium">Division</th>
                <th className="p-4 font-medium">Teacher Assigned</th>
                <th className="p-4 font-medium">Student Count</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClassrooms.map((classroom: any) => (
                <tr key={classroom.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium text-slate-900">{classroom.grade}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                      {classroom.division}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">
                    {classroom.teacherName || <span className="text-slate-400 italic">Unassigned</span>}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Users size={16} className="text-slate-400" />
                      {classroom.studentCount}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(classroom)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(classroom.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredClassrooms.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-500">
              No classrooms found.
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-bold mb-4">
              {editingClassroom ? 'Edit Classroom' : 'Add New Classroom'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Grade / Class</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Grade 8"
                  value={formData.grade}
                  onChange={e => setFormData({...formData, grade: e.target.value})}
                  className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Division</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., A"
                  value={formData.division}
                  onChange={e => setFormData({...formData, division: e.target.value})}
                  className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assign Teacher (Optional)</label>
                <select
                  value={formData.teacherId}
                  onChange={e => setFormData({...formData, teacherId: e.target.value})}
                  className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">-- Unassigned --</option>
                  {teachers.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.fullName}</option>
                  ))}
                </select>
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
                  {editingClassroom ? 'Save Changes' : 'Add Classroom'}
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
