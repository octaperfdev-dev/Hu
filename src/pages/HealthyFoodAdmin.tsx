import React, { useState, useEffect } from 'react';
import { db, collection, updateDoc, doc, onSnapshot, query, where, increment, getDocs, addDoc, deleteDoc } from '../firebase';
import { Plus, Trash2, Apple } from 'lucide-react';

export default function HealthyFoodAdmin() {
  const [pending, setPending] = useState<any[]>([]);
  const [menu, setMenu] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'menu'>('pending');
  const [newMenuItem, setNewMenuItem] = useState({ name: '', price: '' });

  useEffect(() => {
    const unsubPending = onSnapshot(query(collection(db, 'food_purchases'), where('status', '==', 'pending')), (snapshot) => {
      setPending(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubMenu = onSnapshot(collection(db, 'food_menu'), (snapshot) => {
      setMenu(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubPending(); unsubMenu(); };
  }, []);

  const handleApprove = async (id: string, indexNumber: string) => {
    await updateDoc(doc(db, 'food_purchases', id), { status: 'approved' });
    const users = await getDocs(query(collection(db, 'users'), where('indexNumber', '==', indexNumber)));
    if (!users.empty) {
      await updateDoc(doc(db, 'users', users.docs[0].id), { points: increment(10) });
    }
  };

  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'food_menu'), { name: newMenuItem.name, price: Number(newMenuItem.price) });
    setNewMenuItem({ name: '', price: '' });
  };

  const handleDeleteMenuItem = async (id: string) => {
    await deleteDoc(doc(db, 'food_menu', id));
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      <div className="flex gap-4 mb-8">
        <button onClick={() => setActiveTab('pending')} className={`px-6 py-2 rounded-full ${activeTab === 'pending' ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>Pending Approvals</button>
        <button onClick={() => setActiveTab('menu')} className={`px-6 py-2 rounded-full ${activeTab === 'menu' ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>Menu Management</button>
      </div>

      {activeTab === 'pending' ? (
        <div className="space-y-4">
          {pending.map(p => (
            <div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
              <div>
                <p className="font-bold">Index: {p.indexNumber}</p>
                <p className="text-slate-500">{p.time}</p>
              </div>
              <button onClick={() => handleApprove(p.id, p.indexNumber)} className="bg-green-500 text-white px-4 py-2 rounded-xl">Approve</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          <form onSubmit={handleAddMenuItem} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex gap-4">
            <input type="text" placeholder="Item Name" value={newMenuItem.name} onChange={e => setNewMenuItem({...newMenuItem, name: e.target.value})} className="flex-1 p-3 border rounded-xl" />
            <input type="number" placeholder="Price" value={newMenuItem.price} onChange={e => setNewMenuItem({...newMenuItem, price: e.target.value})} className="w-32 p-3 border rounded-xl" />
            <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center gap-2"><Plus size={20} /> Add</button>
          </form>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {menu.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Apple className="text-blue-500" />
                  <div>
                    <p className="font-bold">{item.name}</p>
                    <p className="text-slate-500">Rs {item.price}</p>
                  </div>
                </div>
                <button onClick={() => handleDeleteMenuItem(item.id)} className="text-red-500 p-2"><Trash2 size={20} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
