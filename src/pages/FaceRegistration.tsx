import React, { useState, useEffect } from 'react';
import { db, collection, addDoc, onSnapshot, deleteDoc, doc } from '../firebase';
import { StudentFaceData } from '../types';

export default function FaceRegistration() {
  const [students, setStudents] = useState<any[]>([]);
  const [registeredFaces, setRegisteredFaces] = useState<StudentFaceData[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');

  useEffect(() => {
    const unsubStudents = onSnapshot(collection(db, 'users'), (snapshot) => {
      setStudents(snapshot.docs.filter(d => d.data().role === 'student').map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubFaces = onSnapshot(collection(db, 'student_faces'), (snapshot) => {
      setRegisteredFaces(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as StudentFaceData)));
    });
    return () => { unsubStudents(); unsubFaces(); };
  }, []);

  const handleRegister = async () => {
    if (!selectedStudent) return;
    await addDoc(collection(db, 'student_faces'), {
      userId: selectedStudent,
      imageUrls: ['https://picsum.photos/200'], // Mock image
      createdAt: new Date().toISOString()
    });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Face Registration Portal</h1>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
        <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} className="w-full p-2 border rounded-xl mb-4">
          <option value="">Select Student</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
        </select>
        <button onClick={handleRegister} className="bg-blue-500 text-white px-4 py-2 rounded-xl">Register Face</button>
      </div>
      <div className="space-y-4">
        {registeredFaces.map(f => (
          <div key={f.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
            <p>{students.find(s => s.id === f.userId)?.fullName || 'Unknown'}</p>
            <button onClick={() => deleteDoc(doc(db, 'student_faces', f.id))} className="text-red-500">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
