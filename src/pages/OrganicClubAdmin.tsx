import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType, collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from '../firebase';
import { useAuth } from '../App';
import { QrCode } from 'lucide-react';
import QRScanner from '../components/QRScanner';
import Toast from '../components/Toast';

export default function OrganicClubAdmin() {
  const { user } = useAuth();
  const [vegetables, setVegetables] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [analytics, setAnalytics] = useState<any>({ totalReservations: 0, totalRevenue: 0, popularVegetables: [] });
  const [formData, setFormData] = useState({ name: '', imageUrl: '', description: '', price: 0, quantity: 0, harvestDate: '', sellingDay: '', nutritionBenefits: '', isOrganic: 1 });
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState('g');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const vegSnapshot = await getDocs(collection(db, 'vegetables'));
      const vegData = vegSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVegetables(vegData as any);

      const resSnapshot = await getDocs(collection(db, 'organic_reservations'));
      const resData = resSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReservations(resData as any);

      // Calculate analytics
      let totalRevenue = 0;
      const vegCounts: Record<string, number> = {};

      resData.forEach((res: any) => {
        totalRevenue += res.totalPrice || 0;
        vegCounts[res.vegetableName] = (vegCounts[res.vegetableName] || 0) + res.quantity;
      });

      const popularVegetables = Object.entries(vegCounts)
        .map(([name, totalQuantity]) => ({ name, totalQuantity }))
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, 5);

      setAnalytics({
        totalReservations: resData.length,
        totalRevenue,
        popularVegetables
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'vegetables/organic_reservations');
    }
  };

  const addVegetable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'vegetables'), {
        ...formData,
        createdAt: new Date().toISOString()
      });
      fetchData();
      setToast({ message: 'Vegetable added successfully', type: 'success' });
      setFormData({ name: '', imageUrl: '', description: '', price: 0, quantity: 0, harvestDate: '', sellingDay: '', nutritionBenefits: '', isOrganic: 1 });
    } catch (error) {
      setToast({ message: 'Error adding vegetable', type: 'error' });
      handleFirestoreError(error, OperationType.CREATE, 'vegetables');
    }
  };

  const markCollected = async (id: string) => {
    try {
      await updateDoc(doc(db, 'organic_reservations', id), {
        status: 'Collected',
        weight: weight,
        unit: unit
      });
      setToast({ message: 'Reservation marked as collected', type: 'success' });
      fetchData();
    } catch (error) {
      setToast({ message: 'Error marking reservation', type: 'error' });
      handleFirestoreError(error, OperationType.UPDATE, `organic_reservations/${id}`);
    }
  };

  const deleteVegetable = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vegetable?')) return;
    try {
      await deleteDoc(doc(db, 'vegetables', id));
      fetchData();
      setToast({ message: 'Vegetable deleted successfully', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `vegetables/${id}`);
    }
  };

  const editVegetable = async (id: string, updatedData: any) => {
    try {
      await updateDoc(doc(db, 'vegetables', id), updatedData);
      fetchData();
      setToast({ message: 'Vegetable updated successfully', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `vegetables/${id}`);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Organic Club Admin Panel</h1>
        <button 
          onClick={() => setIsScannerOpen(true)}
          className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors flex items-center gap-2"
        >
          <QrCode size={18} />
          Scan Passbook
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <p className="text-slate-500">Total Reservations</p>
          <p className="text-3xl font-bold">{analytics.totalReservations}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <p className="text-slate-500">Total Revenue</p>
          <p className="text-3xl font-bold">Rs {analytics.totalRevenue}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <p className="text-slate-500">Popular Vegetable</p>
          <p className="text-xl font-bold">{analytics.popularVegetables[0]?.name || 'N/A'}</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Vegetables</h2>
        {vegetables.map((v: any) => (
          <div key={v.id} className="flex items-center justify-between py-3 border-b">
            <div>
              <h3 className="font-bold">{v.name}</h3>
              <p className="text-sm text-slate-500">Rs {v.price} | {v.quantity} units</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => editVegetable(v.id, { ...v, price: v.price + 10 })} className="text-blue-500">Edit</button>
              <button onClick={() => deleteVegetable(v.id)} className="text-red-500">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-xl font-bold mb-4">Reservations</h2>
        {reservations.map((r: any) => (
          <div key={r.id} className="flex items-center justify-between py-3 border-b">
            <div>
              <h3 className="font-bold">{r.vegetableName} - {r.userName}</h3>
              <p className="text-sm text-slate-500">{r.quantity} units</p>
            </div>
            {r.status === 'Reserved' && (
              <div className="flex gap-2">
                <input type="number" placeholder="Weight" onChange={e => setWeight(e.target.value)} className="p-2 border rounded-xl w-20" />
                <select onChange={e => setUnit(e.target.value)} className="p-2 border rounded-xl">
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                </select>
                <button onClick={() => markCollected(r.id)} className="bg-emerald-500 text-white px-4 py-2 rounded-xl">Mark Collected</button>
              </div>
            )}
          </div>
        ))}
      </div>
      {isScannerOpen && <QRScanner onClose={() => setIsScannerOpen(false)} />}
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
