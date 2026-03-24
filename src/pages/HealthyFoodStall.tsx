import React, { useState, useEffect } from 'react';
import { db, collection, query, where, getDocs, addDoc, onSnapshot } from '../firebase';
import NumericKeypad from '../components/NumericKeypad';
import { Camera, Hash, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export default function HealthyFoodStall() {
  const [status, setStatus] = useState<'idle' | 'pending' | 'approved' | 'error'>('idle');
  const [pendingCount, setPendingCount] = useState(0);
  const [indexNumber, setIndexNumber] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'food_purchases'), where('status', '==', 'pending')), (snapshot) => {
      setPendingCount(snapshot.size);
    });
    return () => unsub();
  }, []);

  const handleConfirm = async () => {
    if (!indexNumber) return;
    setStatus('pending');
    try {
      await addDoc(collection(db, 'food_purchases'), {
        indexNumber,
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString(),
        createdAt: new Date().toISOString()
      });
      setIndexNumber('');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (e) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight">Healthy Food Stall</h1>
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 px-6 py-3 rounded-2xl flex items-center gap-4">
            <Clock className="text-yellow-400" />
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold">Pending Approvals</p>
              <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
            </div>
          </div>
        </header>

        {status !== 'idle' && (
          <div className={`mb-12 p-8 rounded-3xl text-center text-3xl font-bold flex items-center justify-center gap-4 backdrop-blur-xl border ${status === 'pending' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' : status === 'approved' ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-red-500/20 border-red-500/50 text-red-400'}`}>
            {status === 'pending' ? <Clock /> : status === 'approved' ? <CheckCircle /> : <AlertCircle />}
            {status === 'pending' ? 'Pending Approval' : status === 'approved' ? 'Approved' : 'Error'}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            <button className="w-full bg-blue-600 hover:bg-blue-700 p-8 rounded-3xl text-3xl font-bold flex items-center justify-center gap-4 transition-all shadow-xl shadow-blue-900/20">
              <Camera size={32} /> Scan Face
            </button>
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl">
              <div className="flex items-center gap-4 mb-4 text-slate-400">
                <Hash /> <span className="font-bold uppercase text-xs">Enter Index Number</span>
              </div>
              <input type="text" value={indexNumber} readOnly placeholder="00000" className="w-full p-6 text-4xl font-mono rounded-2xl bg-slate-950 border border-slate-800 text-white text-center" />
            </div>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl">
            <NumericKeypad onKeyPress={(k) => setIndexNumber(prev => prev + k)} onConfirm={handleConfirm} onClear={() => setIndexNumber('')} />
          </div>
        </div>
      </div>
    </div>
  );
}
