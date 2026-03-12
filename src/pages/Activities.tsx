import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType, collection, query, where, getDocs, addDoc, orderBy, doc, updateDoc, increment, onSnapshot } from '../firebase';
import { 
  Play, 
  Clock, 
  Award, 
  ChevronRight, 
  Search, 
  Filter, 
  Activity as ActivityIcon,
  Plus,
  X,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../App';
import { EXERCISES, SPORTS_TYPES, SCORING_RULES } from '../constants';
import { Activity } from '../types';

export default function Activities() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);

  const [formData, setFormData] = useState({
    userId: '',
    type: 'sport',
    name: SPORTS_TYPES[0],
    date: new Date().toISOString().split('T')[0],
    duration: '',
    performance: 'Good',
    remarks: '',
    points: SCORING_RULES.sport
  });

  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);

    const q = query(collection(db, 'activities'), where('userId', '==', user.id), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Activity[];
      setActivities(data);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'activities');
      setLoading(false);
    });

    if (user?.role === 'admin') {
      fetchStudents();
    }

    return () => unsubscribe();
  }, [user?.id]);

  const fetchStudents = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'student'));
      const querySnapshot = await getDocs(q);
      setStudents(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'users');
    }
  };

  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'activities'), formData);
      
      // Update user points
      const userRef = doc(db, 'users', formData.userId);
      await updateDoc(userRef, {
        points: increment(formData.points)
      });

      setIsModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'activities');
    }
  };

  const handleCompleteExercise = async (exercise: any) => {
    try {
      if (!user?.id) return;
      await addDoc(collection(db, 'activities'), {
        userId: user.id,
        type: 'exercise',
        name: exercise.title,
        date: new Date().toISOString().split('T')[0],
        points: exercise.points
      });

      // Update user points
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        points: increment(exercise.points)
      });

      alert(`Great job! You earned ${exercise.points} points.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'activities');
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Health & Fitness</h1>
          <p className="text-slate-500">Track your activities and learn new exercises</p>
        </div>
        {user?.role === 'admin' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={18} />
            Log Sport Activity
          </button>
        )}
      </div>

      {/* Exercise Tutorials */}
      <section>
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Play size={20} className="text-blue-500" />
          Fitness Tutorials
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {EXERCISES.map((exercise) => (
            <motion.div 
              key={exercise.id}
              whileHover={{ y: -5 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group"
            >
              <div className="aspect-video bg-slate-100 relative">
                <iframe 
                  src={exercise.videoUrl} 
                  className="w-full h-full" 
                  title={exercise.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">{exercise.difficulty}</span>
                  <span className="text-xs font-bold text-slate-400">{exercise.ageGroup}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{exercise.title}</h3>
                <p className="text-sm text-slate-500 mb-4 line-clamp-2">{exercise.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-1 text-blue-600 font-bold">
                    <Award size={16} />
                    <span>{exercise.points} pts</span>
                  </div>
                  <button 
                    onClick={() => handleCompleteExercise(exercise)}
                    className="flex items-center gap-1 text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors"
                  >
                    Mark as Done <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Activity History */}
      <section>
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Clock size={20} className="text-blue-500" />
          Activity History
        </h2>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Activity</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Performance</th>
                  <th className="px-6 py-4">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                          <ActivityIcon size={18} className="text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{activity.name}</p>
                          <p className="text-xs text-slate-500 capitalize">{activity.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{new Date(activity.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{activity.duration || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">{activity.performance || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-blue-600 font-bold">+{activity.points} pts</span>
                    </td>
                  </tr>
                ))}
                {activities.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400">No activities found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Log Activity Modal (Admin) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Log Sport Activity</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleLogActivity} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Select Student</label>
                <select 
                  required
                  value={formData.userId}
                  onChange={(e) => setFormData({...formData, userId: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Choose a student...</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.fullName} ({s.class})</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Sport Type</label>
                <select 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {SPORTS_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Date</label>
                  <input 
                    type="date" 
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Duration</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 1 hour"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Performance</label>
                <select 
                  value={formData.performance}
                  onChange={(e) => setFormData({...formData, performance: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Needs Improvement">Needs Improvement</option>
                </select>
              </div>
              <button type="submit" className="w-full py-3.5 bg-blue-500 text-white rounded-2xl font-bold hover:bg-blue-600 shadow-lg shadow-blue-200 transition-all">
                Log Activity
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
