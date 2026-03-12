import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType, collection, query, where, getDocs, addDoc, updateDoc, doc, increment } from '../firebase';
import { useAuth } from '../App';

export default function CoachActivities() {
  const { user } = useAuth();
  const [athletes, setAthletes] = useState([]);
  const [formData, setFormData] = useState({
    studentId: '',
    sportId: '',
    type: '',
    duration: '',
    performance: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (user) {
      fetchAthletes();
    }
  }, [user]);

  const fetchAthletes = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'student'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAthletes(data as any);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'users');
    }
  };

  const recordActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const points = Math.floor(parseInt(formData.duration) / 10) * 5; // 5 points per 10 mins

      await addDoc(collection(db, 'activities'), {
        userId: formData.studentId,
        name: formData.type,
        duration: parseInt(formData.duration),
        points: points,
        date: formData.date,
        notes: formData.notes,
        recordedBy: user?.id
      });

      // Update student points
      const studentRef = doc(db, 'users', formData.studentId);
      await updateDoc(studentRef, {
        points: increment(points)
      });

      alert('Activity recorded!');
      setFormData({ studentId: '', sportId: '', type: '', duration: '', performance: '', notes: '', date: new Date().toISOString().split('T')[0] });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'activities');
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Record Student Activity</h1>
      <form onSubmit={recordActivity} className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
        <select required value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})} className="w-full p-2 border rounded-xl">
          <option value="">Select Student</option>
          {athletes.map((a: any) => <option key={a.id} value={a.id}>{a.fullName}</option>)}
        </select>
        <input type="text" required placeholder="Activity Type (e.g., Sprint)" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full p-2 border rounded-xl" />
        <input type="number" required placeholder="Duration (min)" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className="w-full p-2 border rounded-xl" />
        <textarea placeholder="Notes" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full p-2 border rounded-xl" />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-xl">Record Activity</button>
      </form>
    </div>
  );
}
