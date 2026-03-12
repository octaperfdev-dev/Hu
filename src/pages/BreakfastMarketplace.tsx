import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType, collection, getDocs, addDoc, updateDoc, doc, increment } from '../firebase';
import { useAuth } from '../App';
import Toast from '../components/Toast';

export default function BreakfastMarketplace() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [quantities, setQuantities] = useState<any>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (user) {
      fetchItems();
    }
  }, [user]);

  const fetchItems = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'breakfast_items'));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(data as any);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'breakfast_items');
    }
  };

  const reserve = async (item: any) => {
    try {
      const quantity = quantities[item.id] || 1;
      
      if (quantity > item.quantity) {
        alert('Not enough quantity available');
        return;
      }

      const totalPrice = item.price * quantity;

      await addDoc(collection(db, 'breakfast_reservations'), {
        userId: user?.id,
        userName: (user as any)?.fullName || 'Unknown',
        itemId: item.id,
        itemName: item.name,
        quantity,
        totalPrice,
        status: 'Reserved',
        createdAt: new Date().toISOString()
      });

      // Decrement item quantity
      const itemRef = doc(db, 'breakfast_items', item.id);
      await updateDoc(itemRef, {
        quantity: increment(-quantity)
      });

      setToast({ message: 'Reserved successfully!', type: 'success' });
      fetchItems();
    } catch (error) {
      setToast({ message: 'Error reserving item', type: 'error' });
      handleFirestoreError(error, OperationType.CREATE, 'breakfast_reservations');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Breakfast Club Marketplace</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((i: any) => (
          <div key={i.id} className="bg-white rounded-2xl shadow-sm border p-6">
            <img src={i.imageUrl} alt={i.name} className="w-full h-48 object-cover rounded-xl mb-4" />
            <h3 className="text-xl font-bold mb-2">{i.name}</h3>
            <p className="text-slate-500 text-sm mb-2">{i.description}</p>
            <p className="text-sm text-emerald-600 mb-2">Nutrition: {i.nutritionInfo}</p>
            <p className="font-bold text-lg mb-2">Rs {i.price} per unit</p>
            <p className="text-sm mb-4">Available: {i.quantity} units</p>
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setQuantities({...quantities, [i.id]: Math.max(1, (quantities[i.id] || 1) - 1)})}>-</button>
              <span>{quantities[i.id] || 1}</span>
              <button onClick={() => setQuantities({...quantities, [i.id]: Math.min(i.quantity, (quantities[i.id] || 1) + 1)})}>+</button>
            </div>
            <button onClick={() => reserve(i)} className="w-full bg-emerald-500 text-white py-2 rounded-xl">Reserve</button>
          </div>
        ))}
      </div>
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
