import React, { useState } from 'react';
import { db, collection, addDoc, query, where, getDocs } from '../firebase';
import NumericKeypad from '../components/NumericKeypad';
import { X, Camera } from 'lucide-react';

export default function FaceRecognitionScanner({ onClose }: { onClose: () => void }) {
  const [showPopup, setShowPopup] = useState(false);
  const [indexNumber, setIndexNumber] = useState('');
  const [message, setMessage] = useState('');

  const simulateScan = async () => {
    // Simulate face not found
    setShowPopup(true);
  };

  const handleRegister = async () => {
    // Link face to student (mock)
    await addDoc(collection(db, 'student_faces'), {
      indexNumber,
      imageUrls: ['https://picsum.photos/200'],
      createdAt: new Date().toISOString()
    });
    setMessage('Face Registered Successfully');
    setShowPopup(false);
    // Proceed with purchase
    await addDoc(collection(db, 'food_purchases'), {
      indexNumber,
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString(),
      createdAt: new Date().toISOString()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-white p-8 rounded-3xl w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
        <h2 className="text-2xl font-bold mb-4 text-center">Face Scanner</h2>
        <div className="bg-slate-200 w-full h-64 rounded-2xl flex items-center justify-center mb-4">
          <Camera size={48} className="text-slate-400" />
        </div>
        <button onClick={simulateScan} className="w-full bg-blue-600 p-4 rounded-2xl text-white font-bold">Start Face Scan</button>
        
        {showPopup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl w-full max-w-md">
              <h2 className="text-2xl font-bold mb-4">Face not registered. Enter Index Number.</h2>
              <input type="text" value={indexNumber} readOnly className="w-full p-4 text-2xl border rounded-xl mb-4" />
              <NumericKeypad onKeyPress={(k) => setIndexNumber(prev => prev + k)} onConfirm={handleRegister} onClear={() => setIndexNumber('')} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
