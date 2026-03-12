import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType, collection, query, where, getDocs } from '../firebase';
import { useAuth } from '../App';
import { getBreakfastInsights } from '../services/aiService';

export default function MyBreakfastReservations() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [insight, setInsight] = useState('');

  useEffect(() => {
    if (user) {
      fetchReservations();
    }
  }, [user]);

  const fetchReservations = async () => {
    try {
      const q = query(collection(db, 'breakfast_reservations'), where('userId', '==', user?.id));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReservations(data as any);
      
      if (data.length > 0) {
        const aiInsight = await getBreakfastInsights(data);
        setInsight(aiInsight);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'breakfast_reservations');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">My Breakfast Reservations</h1>
      
      {insight && (
        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
          <h3 className="font-bold text-blue-800 mb-2">AI Nutrition Insight</h3>
          <p className="text-blue-700">{insight}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border p-6">
        {reservations.map((r: any) => (
          <div key={r.id} className="flex items-center justify-between py-3 border-b">
            <div>
              <h3 className="font-bold">{r.itemName}</h3>
              <p className="text-sm text-slate-500">Reserved: {r.quantity} units | Date: {r.sellingDate}</p>
            </div>
            <div className="text-right">
              <p className="font-bold">Rs {r.totalPrice}</p>
              <p className="text-sm text-slate-500">{r.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

