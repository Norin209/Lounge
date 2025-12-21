'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image'; 
import { db } from '../../_utils/firebase';
import { collection, getDocs, updateDoc, deleteDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { seedProducts } from '../../_utils/seedProducts'; 

const productPlaceholder = "https://images.unsplash.com/photo-1612196808214-b7e239e5f6b7?q=80&w=800";

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); // 🟢 Refresh State
  
  const [newItem, setNewItem] = useState({ 
    name: '', price: '', category: 'Body Care', size: '100ml', 
    isMonthlyPromo: false, isSignature: false, discountValue: '', 
    discountType: 'percent', image: '', description: '' 
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    if (!isRefreshing && loading) setLoading(true);
    
    try {
      const q = await getDocs(collection(db, "products"));
      setProducts(q.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // 🔄 REFRESH FUNCTION
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchProducts();
  };

  const calculateFinalPrice = (p: string, v: string, t: string) => {
    const price = parseFloat(p.replace(/[^0-9.]/g, ''));
    const disc = parseFloat(v);
    if (isNaN(price) || isNaN(disc)) return '---';
    const final = t === 'percent' ? price - (price * (disc / 100)) : price - disc;
    return '$' + final.toFixed(2);
  };

  const toggleStatus = async (id: string, field: string, val: boolean) => {
    await updateDoc(doc(db, "products", id), { [field]: !val });
    fetchProducts(); 
  };

  const startEditing = (p: any) => {
    setEditingId(p.id);
    setNewItem({ ...p });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setNewItem({ name: '', price: '', category: 'Body Care', size: '100ml', isMonthlyPromo: false, isSignature: false, discountValue: '', discountType: 'percent', image: '', description: '' });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateDoc(doc(db, "products", editingId), newItem);
    } else {
      await addDoc(collection(db, "products"), { ...newItem, createdAt: serverTimestamp() });
    }
    cancelEditing();
    fetchProducts();
  };

  const handleSeedData = async () => {
    if (!confirm("This will add MOCK PRODUCTS to your database. Continue?")) return;
    setLoading(true);
    const result = await seedProducts();
    if (result.success) {
      alert(`✅ Successfully added ${result.count} products!`);
      fetchProducts();
    } else {
      alert("❌ Error seeding data.");
    }
    setLoading(false);
  };

  const inputStyle = "w-full bg-white border border-gray-300 text-black text-sm rounded-lg p-2.5 outline-none appearance-none rounded-none";
  const selectStyle = `${inputStyle} bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207l5%205%205-5%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[center_right_0.5rem]`;

  if (loading) return <div className="p-8 text-center text-xs uppercase tracking-widest text-gray-400">Loading Apothecary...</div>;

  return (
    <div className="space-y-8 pb-20 font-sans text-left">
      {/* 📱 RESPONSIVE HEADER WITH REFRESH */}
      <div className="bg-black text-white p-6 md:p-8 rounded-xl flex flex-col md:flex-row justify-between items-center shadow-lg gap-4 text-center md:text-left">
        <h1 className="text-xl md:text-2xl font-bold uppercase tracking-wider font-playfair">Apothecary Manager</h1>
        
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          {/* 🔄 REFRESH BUTTON */}
          <button 
             onClick={handleRefresh} 
             disabled={isRefreshing}
             className={`w-full md:w-auto bg-white text-black text-[10px] font-bold px-4 py-3 rounded-lg border border-transparent hover:bg-gray-200 transition-all ${isRefreshing ? 'opacity-70 cursor-wait' : ''}`}
           >
             {isRefreshing ? 'Loading...' : 'Refresh ↻'}
           </button>

          <button onClick={handleSeedData} className="w-full md:w-auto bg-white/10 text-white text-[10px] font-bold px-4 py-3 rounded-lg border border-white/20">SEED MOCK DATA</button>
        </div>
      </div>
      
      {/* Form Area */}
      <div className={`p-6 rounded-xl border ${editingId ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200 shadow-sm'}`}>
        <h3 className="font-bold text-lg mb-6">{editingId ? '✏️ Edit Product' : 'Add New Product'}</h3>
        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-12"><label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Image URL</label><input value={newItem.image} onChange={e=>setNewItem({...newItem, image: e.target.value})} className={inputStyle} placeholder="https://..." /></div>
          <div className="md:col-span-3"><label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Name</label><input value={newItem.name} onChange={e=>setNewItem({...newItem, name: e.target.value})} className={inputStyle} /></div>
          <div className="md:col-span-2"><label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Price</label><input value={newItem.price} onChange={e=>setNewItem({...newItem, price: e.target.value})} className={inputStyle} placeholder="$0.00" /></div>
          <div className="md:col-span-3"><label className="text-[10px] font-bold text-red-500 uppercase block mb-1">Discount</label><div className="flex gap-2"><input type="number" value={newItem.discountValue} onChange={e=>setNewItem({...newItem, discountValue: e.target.value})} className={`${inputStyle} w-2/3`} /><select value={newItem.discountType} onChange={e=>setNewItem({...newItem, discountType: e.target.value})} className={`${selectStyle} w-1/3`}><option value="percent">%</option><option value="fixed">$</option></select></div></div>
          <div className="md:col-span-2 text-center pb-2"><p className="text-[10px] text-gray-400 uppercase font-bold">Final Price</p><p className="text-xl font-bold text-green-600">{calculateFinalPrice(newItem.price, newItem.discountValue, newItem.discountType)}</p></div>
          <div className="md:col-span-3"><label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Category</label><select value={newItem.category} onChange={e=>setNewItem({...newItem, category: e.target.value})} className={selectStyle}><option value="Body Care">Body Care</option><option value="Aromatherapy">Aromatherapy</option><option value="Apothecary">Apothecary</option><option value="Wellness">Wellness</option></select></div>
          <div className="md:col-span-2"><label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Size</label><input value={newItem.size} onChange={e=>setNewItem({...newItem, size: e.target.value})} className={inputStyle} /></div>
          <div className="md:col-span-7"><label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Description</label><input value={newItem.description} onChange={e=>setNewItem({...newItem, description: e.target.value})} className={inputStyle} /></div>
          <button className={`md:col-span-12 w-full text-white font-bold py-4 uppercase text-xs tracking-widest rounded-none appearance-none ${editingId ? 'bg-amber-600' : 'bg-black'}`}>{editingId ? 'Update Product' : 'Add Product +'}</button>
        </form>
      </div>

      {/* 📱 RESPONSIVE SCROLLABLE TABLE */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-[10px] font-bold uppercase text-gray-400 tracking-widest">
              <tr><th className="px-6 py-4">Image</th><th className="px-6 py-4">Product</th><th className="px-6 py-4">Price</th><th className="px-6 py-4 text-center">Toggles</th><th className="px-6 py-4 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4"><div className="w-12 h-12 relative rounded border border-gray-100 overflow-hidden"><Image src={p.image || productPlaceholder} alt="" fill className="object-cover" /></div></td>
                  <td className="px-6 py-4 font-bold text-black uppercase text-xs">{p.name}</td>
                  <td className="px-6 py-4 font-bold">{p.price}</td>
                  <td className="px-6 py-4 text-center space-x-2"><button onClick={() => toggleStatus(p.id, 'isMonthlyPromo', p.isMonthlyPromo)} className={`px-3 py-1 rounded-full text-[9px] font-bold border ${p.isMonthlyPromo ? 'bg-yellow-100 text-yellow-700' : 'text-gray-300'}`}>Promo</button><button onClick={() => toggleStatus(p.id, 'isSignature', p.isSignature)} className={`px-3 py-1 rounded-full text-[9px] font-bold border ${p.isSignature ? 'bg-purple-100 text-purple-700' : 'text-gray-300'}`}>Sign</button></td>
                  <td className="px-6 py-4 text-right space-x-4"><button onClick={() => startEditing(p)} className="text-blue-500 font-bold uppercase text-[10px]">Edit</button><button onClick={async () => { if(confirm('Delete?')) await deleteDoc(doc(db, "products", p.id)); fetchProducts(); }} className="text-gray-300 hover:text-red-500 font-bold uppercase text-[10px]">Del</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}