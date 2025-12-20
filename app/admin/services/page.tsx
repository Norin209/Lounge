'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image'; 
import { db } from '../../_utils/firebase'; // 👈 REMOVED 'storage' to fix error
import { collection, getDocs, updateDoc, deleteDoc, doc, addDoc } from 'firebase/firestore';
// 👈 REMOVED 'firebase/storage' imports to fix error

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // FORM STATE
  const [newItem, setNewItem] = useState({ 
    name: '', 
    price: '', 
    category: 'facial', 
    duration: '60 min', 
    isMonthlyPromo: false,
    isSignature: false, // 🆕 Signature Flag
    discountValue: '',
    discountType: 'percent',
    image: '' // We will just paste a URL here for now
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');

  // 1. Fetch Data
  const fetchServices = async () => {
    setLoading(true);
    const q = await getDocs(collection(db, "services"));
    const list = q.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setServices(list);
    setLoading(false);
  };

  useEffect(() => { fetchServices(); }, []);

  // 2. Price Calc
  const calculateFinalPrice = (priceStr: string, val: string, type: string) => {
    if (!priceStr || !val) return '---';
    const price = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
    const discount = parseFloat(val);
    if (isNaN(price) || isNaN(discount)) return '---';

    let final = 0;
    if (type === 'percent') {
      final = price - (price * (discount / 100));
    } else {
      final = price - discount;
    }
    return '$' + final.toFixed(2);
  };

  // 3. Actions
  const toggleStatus = async (id: string, field: 'isMonthlyPromo' | 'isSignature', currentValue: boolean) => {
    await updateDoc(doc(db, "services", id), { [field]: !currentValue });
    fetchServices(); 
  };

  const deleteService = async (id: string) => {
    if (confirm("Delete this service?")) {
      await deleteDoc(doc(db, "services", id));
      fetchServices();
    }
  };

  const startEditing = (service: any) => {
    setEditingId(service.id);
    setNewItem({
      name: service.name,
      price: service.price,
      category: service.category,
      duration: service.duration || '60 min',
      isMonthlyPromo: service.isMonthlyPromo || false,
      isSignature: service.isSignature || false, 
      discountValue: service.discountValue || '',
      discountType: service.discountType || 'percent',
      image: service.image || '' 
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setNewItem({ name: '', price: '', category: 'facial', duration: '60 min', isMonthlyPromo: false, isSignature: false, discountValue: '', discountType: 'percent', image: '' });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newItem.name || !newItem.price) return;

    if (editingId) {
      await updateDoc(doc(db, "services", editingId), newItem);
      alert("✅ Service Updated!");
    } else {
      await addDoc(collection(db, "services"), newItem);
    }
    cancelEditing();
    fetchServices();
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

  if (loading) return <div className="p-8">Loading Menu...</div>;

  const inputStyle = "w-full bg-white border border-gray-300 text-black text-sm rounded-lg focus:ring-black focus:border-black block p-2.5 outline-none transition-all";
  const selectStyle = `${inputStyle} appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207l5%205%205-5%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[center_right_0.5rem]`;

  return (
    <div className="space-y-8 pb-20">
      
      {/* FORM */}
      <div className={`p-6 rounded-xl shadow-sm border transition-colors ${editingId ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
        <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-2">
          <h3 className="font-bold text-lg text-black">{editingId ? '✏️ Edit Service' : 'Add New Service'}</h3>
          {editingId && <button onClick={cancelEditing} className="text-xs text-red-500 font-bold underline">Cancel Edit</button>}
        </div>
        
        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          
          {/* SIMPLE IMAGE URL INPUT (No Uploading) */}
          <div className="md:col-span-12 mb-4">
            <label className="block mb-1 text-xs font-bold text-gray-500 uppercase tracking-wider">Image URL (Optional)</label>
            <input 
              value={newItem.image} 
              onChange={e=>setNewItem({...newItem, image: e.target.value})} 
              className={inputStyle} 
              placeholder="https://..." 
            />
          </div>

          <div className="md:col-span-3">
            <label className="block mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</label>
            <input value={newItem.name} onChange={e=>setNewItem({...newItem, name: e.target.value})} className={inputStyle} placeholder="e.g. Gold Facial" />
          </div>
          <div className="md:col-span-2">
            <label className="block mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Price</label>
            <input value={newItem.price} onChange={e=>setNewItem({...newItem, price: e.target.value})} className={inputStyle} placeholder="$0.00" />
          </div>
          <div className="md:col-span-3">
            <label className="block mb-2 text-xs font-bold text-red-500 uppercase tracking-wider">Discount (Optional)</label>
            <div className="flex gap-2">
               <input type="number" value={newItem.discountValue} onChange={e=>setNewItem({...newItem, discountValue: e.target.value})} className={`${inputStyle} w-2/3`} placeholder="0" />
               <select value={newItem.discountType} onChange={e=>setNewItem({...newItem, discountType: e.target.value})} className={`${selectStyle} w-1/3 px-1 text-center`}>
                 <option value="percent">% Off</option>
                 <option value="fixed">$ Off</option>
               </select>
            </div>
          </div>
          <div className="md:col-span-2 text-center pb-2">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">Final Price</p>
            <p className="text-xl font-bold text-green-600">{calculateFinalPrice(newItem.price, newItem.discountValue, newItem.discountType)}</p>
          </div>
          <div className="md:col-span-3">
             <label className="block mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</label>
             <div className="relative">
                <select value={newItem.category} onChange={e=>setNewItem({...newItem, category: e.target.value})} className={selectStyle}>
                  {categories.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
             </div>
          </div>
          <div className="md:col-span-2">
             <label className="block mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Duration</label>
             <input value={newItem.duration} onChange={e=>setNewItem({...newItem, duration: e.target.value})} className={inputStyle} placeholder="60 min" />
          </div>
          
          <div className="md:col-span-12 mt-4">
            <button className={`w-full text-white font-bold rounded-lg text-xs px-5 py-4 uppercase tracking-widest transition-all ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-black hover:bg-zinc-800'}`}>
              {editingId ? 'Update Service' : 'Add Service +'}
            </button>
          </div>
        </form>
      </div>

      {/* FILTER TABS */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button key={cat.id} onClick={() => setActiveFilter(cat.id)} className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all border ${activeFilter === cat.id ? 'bg-black text-white border-black shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-black'}`}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4">Image</th>
                <th className="px-6 py-4">Service Name</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4 text-center">Tags</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredServices.map((s) => (
                <tr key={s.id} className={`transition-colors ${editingId === s.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                  <td className="px-6 py-4">
                     <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden relative border border-gray-200">
                       {s.image ? <Image src={s.image} alt={s.name} fill className="object-cover" /> : <span className="text-[8px] flex items-center justify-center h-full">No Img</span>}
                     </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-black">{s.name}</td>
                  <td className="px-6 py-4 font-bold text-gray-900">{s.price}</td>
                  
                  {/* TAGS */}
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => toggleStatus(s.id, 'isMonthlyPromo', s.isMonthlyPromo)} 
                        className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all border ${s.isMonthlyPromo ? 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200' : 'bg-white text-gray-300 border-gray-100 hover:border-gray-400'}`}
                      >
                        {s.isMonthlyPromo ? '★ Promo' : 'Promo'}
                      </button>

                      <button 
                        onClick={() => toggleStatus(s.id, 'isSignature', s.isSignature)} 
                        className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all border ${s.isSignature ? 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200' : 'bg-white text-gray-300 border-gray-100 hover:border-gray-400'}`}
                      >
                        {s.isSignature ? '◆ Sign' : 'Sign'}
                      </button>
                    </div>
                  </td>

                  {/* ACTIONS */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3 items-center">
                      <button onClick={() => startEditing(s)} className="p-1 hover:bg-blue-50 rounded transition-colors" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                      </button>
                      <button onClick={() => deleteService(s.id)} className="p-1 hover:bg-red-50 rounded transition-colors" title="Delete">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-300 hover:text-red-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}