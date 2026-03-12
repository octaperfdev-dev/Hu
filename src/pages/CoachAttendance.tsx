import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType, collection, query, where, getDocs, addDoc } from '../firebase';
import { useAuth } from '../App';

export default function CoachAttendance() {
  const { user } = useAuth();
  const [athletes, setAthletes] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<any>({});

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
      setAthletes(data);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'users');
    }
  };

  const markAttendance = async () => {
    try {
      const attendanceList = athletes.map((a: any) => ({
        studentId: a.id,
        status: attendance[a.id] || 'Present'
      }));
      
      await addDoc(collection(db, 'attendance'), {
        date,
        recordedBy: user?.id,
        attendance: attendanceList
      });

      alert('Attendance marked!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'attendance');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Mark Training Attendance</h1>
      <input type="date" value={date} onChange={e => setDate(e.target.value)} className="p-2 border rounded-xl mb-4" />
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        {athletes.map((a: any) => (
          <div key={a.id} className="flex items-center justify-between py-3 border-b">
            <span>{a.fullName}</span>
            <select onChange={e => setAttendance({...attendance, [a.id]: e.target.value})} className="p-2 border rounded-xl">
              <option>Present</option>
              <option>Absent</option>
              <option>Excused</option>
            </select>
          </div>
        ))}
        <button onClick={markAttendance} className="mt-6 bg-blue-500 text-white px-4 py-2 rounded-xl">Submit Attendance</button>
      </div>
    </div>
  );
}
