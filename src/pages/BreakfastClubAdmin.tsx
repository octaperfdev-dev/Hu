import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType, collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from '../firebase';
import { useAuth } from '../App';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { QrCode } from 'lucide-react';
import QRScanner from '../components/QRScanner';
import Toast from '../components/Toast';

export default function BreakfastClubAdmin() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [analytics, setAnalytics] = useState<any>({ totalReservations: 0, totalRevenue: 0, popularItems: [] });
  const [formData, setFormData] = useState({ name: '', imageUrl: '', description: '', price: 0, quantity: 0, sellingDate: '', category: '', nutritionInfo: '' });
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const itemsSnapshot = await getDocs(collection(db, 'breakfast_items'));
      const itemsData = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(itemsData as any);

      const reservationsSnapshot = await getDocs(collection(db, 'breakfast_reservations'));
      const reservationsData = reservationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReservations(reservationsData as any);

      // Calculate analytics
      let totalRevenue = 0;
      const itemCounts: Record<string, number> = {};

      reservationsData.forEach((res: any) => {
        totalRevenue += res.totalPrice || 0;
        itemCounts[res.itemName] = (itemCounts[res.itemName] || 0) + res.quantity;
      });

      const popularItems = Object.entries(itemCounts)
        .map(([name, totalQuantity]) => ({ name, totalQuantity }))
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, 5);

      setAnalytics({
        totalReservations: reservationsData.length,
        totalRevenue,
        popularItems
      });

    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'breakfast_items/reservations');
    }
  };

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'breakfast_items'), {
        ...formData,
        createdAt: new Date().toISOString()
      });
      fetchData();
      setToast({ message: 'Item added successfully', type: 'success' });
      setFormData({ name: '', imageUrl: '', description: '', price: 0, quantity: 0, sellingDate: '', category: '', nutritionInfo: '' });
    } catch (error) {
      setToast({ message: 'Error adding item', type: 'error' });
      handleFirestoreError(error, OperationType.CREATE, 'breakfast_items');
    }
  };

  const markCollected = async (id: string) => {
    try {
      await updateDoc(doc(db, 'breakfast_reservations', id), {
        status: 'Collected'
      });
      setToast({ message: 'Reservation marked as collected', type: 'success' });
      fetchData();
    } catch (error) {
      setToast({ message: 'Error marking reservation', type: 'error' });
      handleFirestoreError(error, OperationType.UPDATE, `breakfast_reservations/${id}`);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteDoc(doc(db, 'breakfast_items', id));
      fetchData();
      setToast({ message: 'Item deleted successfully', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `breakfast_items/${id}`);
    }
  };

  const editItem = async (id: string, updatedData: any) => {
    try {
      await updateDoc(doc(db, 'breakfast_items', id), updatedData);
      fetchData();
      setToast({ message: 'Item updated successfully', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `breakfast_items/${id}`);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Breakfast Club Admin Panel</h1>
        <button 
          onClick={() => setIsScannerOpen(true)}
          className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors flex items-center gap-2"
        >
          <QrCode size={18} />
          Scan Passbook
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <p className="text-slate-500">Total Reservations</p>
          <p className="text-3xl font-bold">{analytics.totalReservations}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <p className="text-slate-500">Total Revenue</p>
          <p className="text-3xl font-bold">Rs {analytics.totalRevenue}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <p className="text-slate-500">Popular Item</p>
          <p className="text-xl font-bold">{analytics.popularItems[0]?.name || 'N/A'}</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border">
        <h2 className="text-xl font-bold mb-6">Popular Breakfast Items</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.popularItems}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalQuantity" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Breakfast Items</h2>
        {items.map((i: any) => (
          <div key={i.id} className="flex items-center justify-between py-3 border-b">
            <div>
              <h3 className="font-bold">{i.name}</h3>
              <p className="text-sm text-slate-500">Rs {i.price} | {i.quantity} units</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => editItem(i.id, { ...i, price: i.price + 10 })} className="text-blue-500">Edit</button>
              <button onClick={() => deleteItem(i.id)} className="text-red-500">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-xl font-bold mb-4">Reservations</h2>
        {reservations.map((r: any) => (
          <div key={r.id} className="flex items-center justify-between py-3 border-b">
            <div>
              <h3 className="font-bold">{r.itemName} - {r.userName}</h3>
              <p className="text-sm text-slate-500">{r.quantity} units</p>
            </div>
            {r.status === 'Reserved' && (
              <button onClick={() => markCollected(r.id)} className="bg-emerald-500 text-white px-4 py-2 rounded-xl">Mark Collected</button>
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
