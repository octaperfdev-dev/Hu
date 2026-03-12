import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType, collection, query, getDocs, addDoc, updateDoc, doc, increment } from '../firebase';
import { useAuth } from '../App';
import { ShoppingCart, Leaf, Info } from 'lucide-react';

export default function VegetableMarketplace() {
  const { user } = useAuth();
  const [vegetables, setVegetables] = useState([]);
  const [quantities, setQuantities] = useState<any>({});

  useEffect(() => {
    fetchVegetables();
  }, []);

  const fetchVegetables = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'vegetables'));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVegetables(data as any);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'vegetables');
    }
  };

  const reserve = async (vegetable: any) => {
    if (!user) return;
    const quantity = quantities[vegetable.id] || 1;
    if (quantity > vegetable.quantity) {
      alert('Not enough quantity available');
      return;
    }

    try {
      await addDoc(collection(db, 'organic_reservations'), {
        userId: user.id,
        userName: user.fullName,
        vegetableId: vegetable.id,
        vegetableName: vegetable.name,
        quantity,
        totalPrice: vegetable.price * quantity,
        status: 'pending',
        date: new Date().toISOString()
      });

      const vegRef = doc(db, 'vegetables', vegetable.id);
      await updateDoc(vegRef, {
        quantity: increment(-quantity)
      });

      alert('Reserved successfully!');
      fetchVegetables();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'organic_reservations');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Organic Vegetable Marketplace</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {vegetables.map((v: any) => (
          <div key={v.id} className="bg-white rounded-2xl shadow-sm border p-6">
            <img src={v.imageUrl} alt={v.name} className="w-full h-48 object-cover rounded-xl mb-4" />
            <h3 className="text-xl font-bold mb-2">{v.name} {v.isOrganic && <span className="text-emerald-500 text-sm bg-emerald-50 px-2 py-1 rounded-full">Organic</span>}</h3>
            <p className="text-slate-500 text-sm mb-2">{v.description}</p>
            <p className="text-sm text-emerald-600 mb-2">Benefits: {v.nutritionBenefits}</p>
            <p className="font-bold text-lg mb-2">Rs {v.price} per unit</p>
            <p className="text-sm mb-4">Available: {v.quantity} units</p>
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setQuantities({...quantities, [v.id]: Math.max(1, (quantities[v.id] || 1) - 1)})}>-</button>
              <span>{quantities[v.id] || 1}</span>
              <button onClick={() => setQuantities({...quantities, [v.id]: Math.min(v.quantity, (quantities[v.id] || 1) + 1)})}>+</button>
            </div>
            <button onClick={() => reserve(v)} className="w-full bg-emerald-500 text-white py-2 rounded-xl">Reserve</button>
          </div>
        ))}
      </div>
    </div>
  );
}
