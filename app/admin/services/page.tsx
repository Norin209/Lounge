'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image'; 
import { db } from '../../_utils/firebase';
import { collection, getDocs, updateDoc, deleteDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { uploadServices } from '../../_utils/uploadServices'; 

const treatmentPlaceholder = "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=800";

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); // 🟢 Refresh State
  
  const [newItem, setNewItem] = useState({ 
    name: '', price: '', category: 'facial', duration: '60 min', 
    isMonthlyPromo: false, isSignature: false, 
    discountValue: '', discountType: 'percent', image: '',
    description: '' 
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => { fetchServices(); }, []);

  const fetchServices = async () => {
    // Don't set full loading to true on refresh, just isRefreshing
    if (!isRefreshing && loading) setLoading(true);
    
    try {
      const q = await getDocs(collection(db, "services"));
      const list = q.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setServices(list);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // 🔄 REFRESH FUNCTION
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchServices();
  };

  const calculateFinalPrice = (priceStr: string, val: string, type: string) => {
    if (!priceStr || !val) return '---';
    const price = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
    const discount = parseFloat(val);
    if (isNaN(price) || isNaN(discount)) return '---';
    let final = type === 'percent' ? price - (price * (discount / 100)) : price - discount;
    return '$' + final.toFixed(2);
  };

  const toggleStatus = async (id: string, field: string, currentValue: boolean) => {
    await updateDoc(doc(db, "services", id), { [field]: !currentValue });
    fetchServices(); 
  };

  const startEditing = (service: any) => {
    setEditingId(service.id);
    setNewItem({ ...service });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setNewItem({ name: '', price: '', category: 'facial', duration: '60 min', isMonthlyPromo: false, isSignature: false, discountValue: '', discountType: 'percent', image: '', description: '' });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateDoc(doc(db, "services", editingId), newItem);
    } else {
      await addDoc(collection(db, "services"), { ...newItem, createdAt: serverTimestamp() });
    }
    cancelEditing();
    fetchServices();
  };

  const handleUploadData = async () => {
    if (!confirm("This will upload the MASTER MENU to Firebase. Continue?")) return;
    setLoading(true);
    const result = await uploadServices();
    if (result.success) {
      alert(`✅ Successfully added ${result.count} services!`);
      fetchServices();
    } else {
      alert("❌ Error uploading data.");
    }
    setLoading(false);
  };

  const categories = [
    { id: 'all', label: 'View All' },
    { id: 'facial', label: 'Facial' },
    { id: 'body', label: 'Body' },
    { id: 'nails', label: 'Nails' },
    { id: 'hair', label: 'Hair' },
    { id: 'wax', label: 'Wax' },
    { id: 'package', label: 'Packages' },
    { id: 'carwash', label: 'Car Wash' },
  ];

  const filteredServices = activeFilter === 'all' ? services : services.filter(s => s.category?.toLowerCase() === activeFilter);
  const inputStyle = "w-full bg-white border border-gray-300 text-black text-sm rounded-lg p-2.5 outline-none appearance-none rounded-none";
  const selectStyle = `${inputStyle} bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207l5%205%205-5%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[center_right_0.5rem]`;

  if (loading) return <div className="p-8 text-center text-xs uppercase tracking-widest text-gray-400">Loading Menu...</div>;

  return (
    <div className="space-y-8 pb-20 font-sans text-left">
      {/* 📱 RESPONSIVE HEADER WITH REFRESH */}
      <div className="bg-black text-white p-6 md:p-8 rounded-xl flex flex-col md:flex-row justify-between items-center shadow-lg gap-4 text-center md:text-left">
        <div>
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-wider font-playfair">Services Manager</h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">Treatment & Menu Control</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
           {/* 🔄 REFRESH BUTTON */}
           <button 
             onClick={handleRefresh} 
             disabled={isRefreshing}
             className={`w-full md:w-auto bg-white text-black text-[10px] font-bold px-4 py-3 rounded-lg border border-transparent hover:bg-gray-200 transition-all ${isRefreshing ? 'opacity-70 cursor-wait' : ''}`}
           >
             {isRefreshing ? 'Loading...' : 'Refresh ↻'}
           </button>
           
           <button onClick={handleUploadData} className="w-full md:w-auto bg-white/10 text-white text-[10px] font-bold px-4 py-3 rounded-lg border border-white/20 hover:bg-white/20 transition-all">
             UPLOAD MASTER MENU
           </button>
        </div>
      </div>

      {/* FORM */}
      <div className={`p-6 rounded-xl border ${editingId ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-100">
          <h3 className="font-bold text-lg text-black">{editingId ? '✏️ Edit Service' : 'Add New Service'}</h3>
          {editingId && <button onClick={cancelEditing} className="text-xs text-red-500 font-bold underline">Cancel Edit</button>}
        </div>
        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
           <div className="md:col-span-12"><label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Image URL</label><input value={newItem.image} onChange={e=>setNewItem({...newItem, image: e.target.value})} className={inputStyle} placeholder="https://..." /></div>
           <div className="md:col-span-3"><label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Service Name</label><input value={newItem.name} onChange={e=>setNewItem({...newItem, name: e.target.value})} className={inputStyle} placeholder="e.g. Gold Facial" /></div>
           <div className="md:col-span-2"><label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Price</label><input value={newItem.price} onChange={e=>setNewItem({...newItem, price: e.target.value})} className={inputStyle} placeholder="$0.00" /></div>
           <div className="md:col-span-3"><label className="text-[10px] font-bold text-red-500 uppercase block mb-1">Discount</label><div className="flex gap-2"><input type="number" value={newItem.discountValue} onChange={e=>setNewItem({...newItem, discountValue: e.target.value})} className={`${inputStyle} w-2/3`} placeholder="0" /><select value={newItem.discountType} onChange={e=>setNewItem({...newItem, discountType: e.target.value})} className={`${selectStyle} w-1/3 px-1 text-center`}><option value="percent">% Off</option><option value="fixed">$ Off</option></select></div></div>
           <div className="md:col-span-2 text-center pb-2"><p className="text-[10px] text-gray-400 uppercase font-bold">Final Price</p><p className="text-xl font-bold text-green-600">{calculateFinalPrice(newItem.price, newItem.discountValue, newItem.discountType)}</p></div>
           <div className="md:col-span-3"><label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Category</label><select value={newItem.category} onChange={e=>setNewItem({...newItem, category: e.target.value})} className={selectStyle}>{categories.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
           <div className="md:col-span-2"><label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Duration</label><input value={newItem.duration} onChange={e=>setNewItem({...newItem, duration: e.target.value})} className={inputStyle} placeholder="60 min" /></div>
           <div className="md:col-span-7"><label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Treatment Description</label><input value={newItem.description} onChange={e=>setNewItem({...newItem, description: e.target.value})} className={inputStyle} placeholder="Describe the treatment benefits..." /></div>
           <button className={`md:col-span-12 w-full text-white font-bold py-4 uppercase text-xs tracking-widest rounded-none appearance-none ${editingId ? 'bg-amber-600' : 'bg-black'}`}>{editingId ? 'Update Service' : 'Add Service +'}</button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button key={cat.id} onClick={() => setActiveFilter(cat.id)} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all border ${activeFilter === cat.id ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-200'}`}>{cat.label}</button>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-[10px] font-bold uppercase text-gray-400 tracking-widest">
              <tr><th className="px-6 py-4">Image</th><th className="px-6 py-4">Service Details</th><th className="px-6 py-4">Price</th><th className="px-6 py-4 text-center">Tags</th><th className="px-6 py-4 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredServices.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4"><div className="w-12 h-12 relative rounded border border-gray-100 overflow-hidden"><Image src={s.image || treatmentPlaceholder} alt="" fill className="object-cover" /></div></td>
                  <td className="px-6 py-4"><p className="font-bold text-black uppercase text-xs">{s.name}</p><p className="text-[10px] text-gray-400 uppercase tracking-widest">{s.duration}</p></td>
                  <td className="px-6 py-4 font-bold">{s.price}</td>
                  <td className="px-6 py-4 text-center space-x-2"><button onClick={() => toggleStatus(s.id, 'isMonthlyPromo', s.isMonthlyPromo)} className={`px-3 py-1 rounded-full text-[9px] font-bold border transition-all ${s.isMonthlyPromo ? 'bg-yellow-100 text-yellow-700' : 'text-gray-300 border-gray-100'}`}>Promo</button><button onClick={() => toggleStatus(s.id, 'isSignature', s.isSignature)} className={`px-3 py-1 rounded-full text-[9px] font-bold border transition-all ${s.isSignature ? 'bg-purple-100 text-purple-700' : 'text-gray-300 border-gray-100'}`}>Sign</button></td>
                  <td className="px-6 py-4 text-right space-x-4"><button onClick={() => startEditing(s)} className="text-blue-500 font-bold uppercase text-[10px] tracking-tighter">Edit</button><button onClick={async () => { if(confirm('Delete?')) await deleteDoc(doc(db, "services", s.id)); fetchServices(); }} className="text-gray-300 hover:text-red-500 font-bold uppercase text-[10px] tracking-tighter">Del</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}