import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType, collection, query, where, getDocs, addDoc, doc, deleteDoc, setDoc, initializeApp, deleteApp, getAuth, createUserWithEmailAndPassword, firebaseConfig } from '../firebase';
import { Plus, Trash2, Users, UserPlus, Award } from 'lucide-react';
import { useAuth } from '../App';
import Toast from '../components/Toast';

export default function AdminSports() {
  const [sports, setSports] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddSportModal, setShowAddSportModal] = useState(false);
  const [showAddCoachModal, setShowAddCoachModal] = useState(false);
  const [newSport, setNewSport] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [newCoach, setNewCoach] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    indexNumber: '',
    sportsManaged: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch Sports
      const sportsSnapshot = await getDocs(collection(db, 'sports'));
      const sportsData = sportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Fetch Coaches
      const coachQuery = query(collection(db, 'users'), where('role', '==', 'coach'));
      const coachSnapshot = await getDocs(coachQuery);
      const coachData = coachSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fetch Activities to get student counts per sport
      const activitiesSnapshot = await getDocs(collection(db, 'activities'));
      const activities = activitiesSnapshot.docs.map(doc => doc.data());

      const enrichedSports = sportsData.map((s: any) => {
        const studentCount = new Set(activities.filter(a => a.name === s.name).map(a => a.userId)).size;
        return { ...s, studentCount };
      });

      setSports(enrichedSports as any);
      setCoaches(coachData as any);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'sports/coaches');
    } finally {
      setLoading(false);
    }
  };

  const addSport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'sports'), { name: newSport });
      setShowAddSportModal(false);
      setNewSport('');
      setToast({ message: 'Sport added successfully', type: 'success' });
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'sports');
    }
  };

  const addCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tempApp = initializeApp(firebaseConfig as any, 'temp-create-coach-' + Date.now());
      const tempAuth = getAuth(tempApp);
      
      const userCredential = await createUserWithEmailAndPassword(tempAuth, newCoach.email, newCoach.password);
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        fullName: newCoach.fullName,
        email: newCoach.email,
        phone: newCoach.phone,
        indexNumber: newCoach.indexNumber,
        role: 'coach',
        createdAt: new Date().toISOString()
      });
      
      await deleteApp(tempApp);
      
      setShowAddCoachModal(false);
      setToast({ message: 'Coach added successfully', type: 'success' });
      setNewCoach({ fullName: '', email: '', password: '', phone: '', indexNumber: '', sportsManaged: [] });
      fetchData();
    } catch (err: any) {
      console.error("Error adding coach:", err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      if (errorMessage.includes('auth/email-already-in-use')) {
        setToast({ message: 'Email is already taken.', type: 'error' });
      } else if (errorMessage.includes('auth/weak-password')) {
        setToast({ message: 'Password should be at least 6 characters.', type: 'error' });
      } else {
        setToast({ message: 'Failed to add coach. Please try again.', type: 'error' });
      }
    }
  };

  const deleteSport = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sport?')) return;
    try {
      await deleteDoc(doc(db, 'sports', id));
      setToast({ message: 'Sport deleted successfully', type: 'success' });
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `sports/${id}`);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Sports Management</h1>
        <div className="flex gap-3">
          <button onClick={() => setShowAddSportModal(true)} className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-xl hover:bg-indigo-600 transition-colors">
            <Plus size={20} /> Add Sport
          </button>
          <button onClick={() => setShowAddCoachModal(true)} className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors">
            <UserPlus size={20} /> Add Coach
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Sports Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold mb-4">Sports Categories</h2>
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-sm border-b border-slate-200">
                <th className="p-2">Sport</th>
                <th className="p-2">Students</th>
                <th className="p-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sports.map((s: any) => (
                <tr key={s.id} className="border-b border-slate-100">
                  <td className="p-2 font-medium">{s.name}</td>
                  <td className="p-2">{s.studentCount}</td>
                  <td className="p-2 text-right">
                    <button onClick={() => deleteSport(s.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Coaches Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold mb-4">Coaches</h2>
          <div className="space-y-4">
            {coaches.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <div className="font-medium">{c.fullName}</div>
                  <div className="text-sm text-slate-500">{c.email}</div>
                </div>
                <div className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                  {c.assignedClasses ? JSON.parse(c.assignedClasses).join(', ') : 'No sports'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Sport Modal */}
      {showAddSportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">Add Sport</h2>
            <form onSubmit={addSport}>
              <input type="text" required value={newSport} onChange={e => setNewSport(e.target.value)} className="w-full p-2 border border-slate-200 rounded-xl mb-4" placeholder="Sport Name" />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddSportModal(false)} className="px-4 py-2 text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-500 text-white rounded-xl">Add</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add Coach Modal */}
      {showAddCoachModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Add Coach</h2>
            <form onSubmit={addCoach} className="space-y-4">
              <input type="text" required placeholder="Full Name" value={newCoach.fullName} onChange={e => setNewCoach({...newCoach, fullName: e.target.value})} className="w-full p-2 border border-slate-200 rounded-xl" />
              <input type="email" required placeholder="Email" value={newCoach.email} onChange={e => setNewCoach({...newCoach, email: e.target.value})} className="w-full p-2 border border-slate-200 rounded-xl" />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddCoachModal(false)} className="px-4 py-2 text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-xl">Add Coach</button>
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
