import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType, collection, query, where, getDocs } from '../firebase';
import { useAuth } from '../App';

export default function MyReservations() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState<any>({ totalSpent: 0, reservationCount: 0, badge: 'None' });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const q = query(collection(db, 'organic_reservations'), where('userId', '==', user?.id));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setReservations(data as any);

      // Calculate stats
      let totalSpent = 0;
      data.forEach((r: any) => {
        totalSpent += r.totalPrice || 0;
      });

      let badge = 'Seedling';
      if (totalSpent > 1000) badge = 'Harvester';
      if (totalSpent > 5000) badge = 'Master Farmer';

      setStats({
        totalSpent,
        reservationCount: data.length,
        badge
      });

    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'organic_reservations');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Reservations</h1>
      
      <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 mb-6">
        <h2 className="font-bold text-emerald-800">Organic Consumption Badge</h2>
        <p className="text-3xl font-bold text-emerald-600">{stats.badge}</p>
        <p className="text-sm text-emerald-700">Total Spent: Rs {stats.totalSpent} | Reservations: {stats.reservationCount}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border p-6">
        {reservations.map((r: any) => (
          <div key={r.id} className="flex items-center justify-between py-3 border-b">
            <div>
              <h3 className="font-bold">{r.vegetableName}</h3>
              <p className="text-sm text-slate-500">Reserved: {r.quantity} units</p>
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
