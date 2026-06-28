'use client';

import { useState, useEffect } from 'react';
import { db } from '../../_utils/firebase'; 
import { collection, getDocs, updateDoc, deleteDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore'; 

export default function PromoAdminPage() {
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  
  const [newPromo, setNewPromo] = useState({
    code: '',
    discount: '',
    type: 'percent',
    isActive: true
  });

  useEffect(() => { 
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    if (!isRefreshing && loading) setLoading(true);
    try {
      const q = await getDocs(collection(db, "promocodes"));
      const list = q.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPromos(list);
    } catch (error) {
      console.error("Error fetching promos:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPromos();
  };

  const handlePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedCode = newPromo.code.trim().toUpperCase();
    if (!formattedCode) return alert("Code cannot be empty");

    const promoData = {
      code: formattedCode,
      discount: parseFloat(newPromo.discount),
      type: newPromo.type,
      isActive: newPromo.isActive
    };

    try {
      if (editingPromoId) {
        await updateDoc(doc(db, "promocodes", editingPromoId), promoData);
      } else {
        await addDoc(collection(db, "promocodes"), { ...promoData, createdAt: serverTimestamp() });
      }
      cancelPromoEditing();
      fetchPromos();
    } catch (error) {
      console.error("Error saving promo code:", error);
      alert("Failed to save promo code.");
    }
  };

  const togglePromoStatus = async (id: string, currentValue: boolean) => {
    try {
      await updateDoc(doc(db, "promocodes", id), { isActive: !currentValue });
      fetchPromos();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const startPromoEditing = (promo: any) => {
    setEditingPromoId(promo.id);
    setNewPromo({ 
      code: promo.code, 
      discount: promo.discount, 
      type: promo.type || 'percent', 
      isActive: promo.isActive 
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelPromoEditing = () => {
    setEditingPromoId(null);
    setNewPromo({ code: '', discount: '', type: 'percent', isActive: true });
  };

  const inputStyle = "w-full bg-white border border-gray-300 text-black text-sm rounded-lg p-2.5 outline-none appearance-none rounded-none";
  const selectStyle = `${inputStyle} bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207l5%205%205-5%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[center_right_0.5rem]`;

  if (loading) return <div className="p-8 text-center text-xs uppercase tracking-widest text-gray-400">Loading Promos...</div>;

  return (
    <div className="space-y-8 pb-20 font-sans text-left relative max-w-7xl mx-auto px-4 mt-8">
      
      {/* HEADER */}
      <div className="bg-black text-white p-6 md:p-8 rounded-xl flex flex-col md:flex-row justify-between items-center shadow-lg gap-4 text-center md:text-left">
        <div>
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-wider">Promo Codes</h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">Manage Discounts & Offers</p>
        </div>
        
        <button onClick={handleRefresh} disabled={isRefreshing} className={`w-full md:w-auto bg-white text-black text-[10px] font-bold px-6 py-3 rounded-lg hover:bg-gray-200 transition-all uppercase tracking-widest ${isRefreshing ? 'opacity-70 cursor-wait' : ''}`}>
          {isRefreshing ? 'Refreshing...' : 'Refresh ↻'}
        </button>
      </div>

      {/* FORM */}
      <div className={`p-6 rounded-xl border ${editingPromoId ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-100">
          <h3 className="font-bold text-lg text-black">{editingPromoId ? '✏️ Edit Promo Code' : 'Create Promo Code'}</h3>
          {editingPromoId && <button onClick={cancelPromoEditing} className="text-xs text-red-500 font-bold underline">Cancel Edit</button>}
        </div>

        <form onSubmit={handlePromoSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Code (e.g., GLISTEN20)</label>
            <input required value={newPromo.code} onChange={e=>setNewPromo({...newPromo, code: e.target.value.toUpperCase()})} className={inputStyle} placeholder="SUMMER30" />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Discount Amount</label>
            <input required type="number" value={newPromo.discount} onChange={e=>setNewPromo({...newPromo, discount: e.target.value})} className={inputStyle} placeholder="20" />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Discount Type</label>
            <select value={newPromo.type} onChange={e=>setNewPromo({...newPromo, type: e.target.value})} className={selectStyle}>
              <option value="percent">% Off Percentage</option>
              <option value="fixed">$ Off Fixed Amount</option>
            </select>
          </div>

          <button className={`w-full text-white font-bold py-3 rounded-lg uppercase text-xs tracking-widest ${editingPromoId ? 'bg-amber-600' : 'bg-black'}`}>
            {editingPromoId ? 'Update Code' : 'Create Code +'}
          </button>
        </form>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-[10px] font-bold uppercase text-gray-400 tracking-widest">
              <tr>
                <th className="px-6 py-4">Promo Code</th>
                <th className="px-6 py-4">Discount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {promos.length > 0 ? promos.map((p) => (
                <tr key={p.id} className={`transition-all ${!p.isActive ? 'bg-gray-50 opacity-60 grayscale-50' : 'hover:bg-gray-50'}`}>
                  <td className="px-6 py-4">
                    <span className="font-bold uppercase tracking-wider text-black bg-gray-100 px-3 py-1.5 rounded">{p.code}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-green-600">
                    {p.type === 'percent' ? `${p.discount}% OFF` : `$${p.discount} OFF`}
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => togglePromoStatus(p.id, p.isActive)} className={`px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest border transition-all ${!p.isActive ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'}`}>
                      {p.isActive ? 'Active' : 'Turned Off'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right space-x-4">
                    <button onClick={() => startPromoEditing(p)} className="text-blue-500 font-bold uppercase text-[10px]">Edit</button>
                    <button onClick={async () => { if(confirm('Delete this code?')) { await deleteDoc(doc(db, "promocodes", p.id)); fetchPromos(); } }} className="text-gray-300 hover:text-red-500 font-bold uppercase text-[10px]">Del</button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-xs text-gray-400 uppercase tracking-widest">
                    No Promo Codes Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}