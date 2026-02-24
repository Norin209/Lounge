'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image'; 
import { db, storage } from '../../_utils/firebase'; 
import { collection, getDocs, updateDoc, deleteDoc, doc, addDoc, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; 

const washPlaceholder = "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?q=80&w=800";

// INTERNAL SEED DATA
const mockWashData = [
  { name: "Premium Foam Wash", price: "$10.00", category: "wash", duration: "30 min", description: "Full exterior foam wash." },
  { name: "Interior Deep Clean", price: "$25.00", category: "detailing", duration: "60 min", description: "Vacuum, wipe down, and scent." },
  { name: "Motul Oil Change", price: "$19.00", category: "oilchange", duration: "20 min", description: "1L Synthetic Oil." },
  { name: "VIP Full Package", price: "$35.00", category: "detailing", duration: "90 min", description: "Wash + Wax + Interior." }
];

// DEFAULT CATEGORIES
const DEFAULT_CATS = [
  { id: 'wash', label: 'Wash' },
  { id: 'detailing', label: 'Detailing' },
  { id: 'oilchange', label: 'Oil Change' },
  { id: 'packages', label: 'Packages' },
];

export default function AdminCarWash() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false); 
  
  // DYNAMIC CATEGORY STATE
  const [categories, setCategories] = useState<any[]>([{ id: 'all', label: 'View All' }]);
  const [showCatModal, setShowCatModal] = useState(false);
  const [tempCats, setTempCats] = useState<any[]>([]);
  const [newCatName, setNewCatName] = useState('');

  // DRAG STATE
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // FORM STATE
  const [newItem, setNewItem] = useState({ 
    name: '', 
    price: '', 
    category: 'wash', 
    duration: '30 min', 
    isMonthlyPromo: false, 
    isSignature: false, 
    isPaused: false,
    discountValue: '', 
    discountType: 'percent', 
    image: '',
    description: '', 
    order: 10
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => { 
    fetchCategories(); 
    fetchServices(); 
  }, []);

  const fetchCategories = async () => {
    try {
      const docRef = doc(db, "settings", "carwash_categories");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setCategories([{ id: 'all', label: 'View All' }, ...docSnap.data().list]);
      } else {
        await setDoc(docRef, { list: DEFAULT_CATS });
        setCategories([{ id: 'all', label: 'View All' }, ...DEFAULT_CATS]);
      }
    } catch (error) { console.error("Cat Error:", error); }
  };

  const saveCategories = async () => {
    if (tempCats.length === 0) return alert("Need at least 1 category");
    try {
        await setDoc(doc(db, "settings", "carwash_categories"), { list: tempCats });
        setCategories([{ id: 'all', label: 'View All' }, ...tempCats]);
        setShowCatModal(false);
    } catch (error) {
        console.error("Error saving categories:", error);
    }
  };

  const handleCatImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return alert("Image too large. Please use a file under 2MB.");
    setIsUploading(true); 
    try {
      const storageRef = ref(storage, `categories/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      const updatedCats = [...tempCats];
      updatedCats[index] = { ...updatedCats[index], image: url };
      setTempCats(updatedCats);
    } catch (error) {
      console.error("Category Upload Error:", error);
      alert("Failed to upload category image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); 
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    const newCats = [...tempCats];
    const draggedItem = newCats[draggedIndex];
    newCats.splice(draggedIndex, 1);
    newCats.splice(index, 0, draggedItem);
    setTempCats(newCats);
    setDraggedIndex(null);
  };

  const fetchServices = async () => {
    if (!isRefreshing && loading) setLoading(true);
    try {
      const q = await getDocs(collection(db, "carwash"));
      const list = q.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a: any, b: any) => (a.order ?? 999) - (b.order ?? 999));
      setServices(list);
    } catch (error) {
      console.error("Error fetching car wash services:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => { setIsRefreshing(true); fetchServices(); };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image is too large. Please use a file under 2MB.");
      return;
    }

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `carwash/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setNewItem({ ...newItem, image: url });
    } catch (error) {
      alert("Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
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
    await updateDoc(doc(db, "carwash", id), { [field]: !currentValue });
    fetchServices(); 
  };

  const startEditing = (service: any) => {
    setEditingId(service.id);
    setNewItem({ 
      name: service.name || '', 
      price: service.price || '', 
      category: service.category || 'wash', 
      duration: service.duration || '', 
      isMonthlyPromo: service.isMonthlyPromo || false, 
      isSignature: service.isSignature || false, 
      isPaused: service.isPaused || false,
      discountValue: service.discountValue || '', 
      discountType: service.discountType || 'percent', 
      image: service.image || '',
      description: service.description || '', 
      order: service.order ?? 10 
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setNewItem({ 
      name: '', 
      price: '', 
      category: 'wash', 
      duration: '30 min', 
      isMonthlyPromo: false, 
      isSignature: false, 
      isPaused: false,
      discountValue: '', 
      discountType: 'percent', 
      image: '', 
      description: '', 
      order: 10 
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateDoc(doc(db, "carwash", editingId), newItem);
    } else {
      await addDoc(collection(db, "carwash"), { ...newItem, createdAt: serverTimestamp() });
    }
    cancelEditing();
    fetchServices();
  };

  const handleUploadData = async () => {
    if (!confirm("Add MOCK WASH SERVICES to Database?")) return;
    setLoading(true);
    try {
      for (const s of mockWashData) { await addDoc(collection(db, "carwash"), { ...s, createdAt: serverTimestamp() }); }
      alert(`✅ Added ${mockWashData.length} services!`); fetchServices();
    } catch (e) { alert("Error uploading."); }
    setLoading(false);
  };

  const filteredServices = activeFilter === 'all' ? services : services.filter(s => s.category?.toLowerCase() === activeFilter.toLowerCase());
  const inputStyle = "w-full bg-white border border-gray-300 text-black text-sm rounded-lg p-2.5 outline-none appearance-none rounded-none";
  const selectStyle = `${inputStyle} bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207l5%205%205-5%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[center_right_0.5rem]`;

  if (loading) return <div className="p-8 text-center text-xs uppercase tracking-widest text-gray-400">Loading Car Wash...</div>;

  return (
    <div className="space-y-8 pb-20 font-sans text-left relative">
      
      {/* CATEGORY EDITOR MODAL */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold">Manage Categories</h3>
              <button onClick={() => setShowCatModal(false)}>✕</button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-4">Drag to reorder • Click box to add image</p>
              
              {tempCats.map((cat, i) => (
                <div 
                    key={cat.id || i} 
                    className={`flex gap-2 items-center p-2 border rounded mb-2 bg-white transition-all ${draggedIndex === i ? 'opacity-50' : ''}`}
                    draggable
                    onDragStart={() => handleDragStart(i)}
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDrop={() => handleDrop(i)}
                >
                    <div className="cursor-move text-gray-300 hover:text-black px-1 select-none">⋮⋮</div>
                    
                    <div className="relative w-10 h-10 shrink-0 group">
                      <input type="file" id={`cat-file-${i}`} accept="image/*" className="hidden" onChange={(e) => handleCatImageUpload(e, i)} />
                      <label htmlFor={`cat-file-${i}`} className="w-full h-full rounded overflow-hidden cursor-pointer border border-gray-200 hover:border-black transition-colors bg-gray-50 flex items-center justify-center relative">
                        {cat.image ? <img src={cat.image} alt="" className="w-full h-full object-cover" /> : <span className="text-[8px] text-gray-400 text-center leading-tight">ADD<br/>IMG</span>}
                        <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-bold">EDIT</div>
                      </label>
                    </div>

                    <input 
                      value={cat.label} 
                      onChange={(e) => { 
                        const n = [...tempCats]; 
                        n[i] = { ...n[i], label: e.target.value }; 
                        setTempCats(n); 
                      }} 
                      className="flex-1 border-none outline-none text-sm font-bold text-gray-700 bg-transparent focus:text-black" 
                      placeholder="Category Name" 
                    />
                    <button onClick={() => setTempCats(tempCats.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-500 font-bold px-2">✕</button>
                </div>
              ))}
              <div className="flex gap-2 mt-4 pt-4 border-t">
                  <input placeholder="New Category..." value={newCatName} onChange={e => setNewCatName(e.target.value)} className="flex-1 border p-2 text-sm rounded" />
                  <button onClick={() => { 
                    if(newCatName) { 
                      setTempCats([...tempCats, { id: newCatName.toLowerCase().replace(/[^a-z0-9]/g, ''), label: newCatName, image: '' }]); 
                      setNewCatName(''); 
                    } 
                  }} className="bg-black text-white px-4 text-xs font-bold rounded">ADD</button>
              </div>
            </div>
            <div className="p-4 bg-gray-50 flex justify-end gap-2">
              <button onClick={() => setShowCatModal(false)} className="px-4 py-2 text-xs font-bold text-gray-500">CANCEL</button>
              <button onClick={saveCategories} className="px-4 py-2 text-xs font-bold bg-green-600 text-white rounded">SAVE CHANGES</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-black text-white p-6 md:p-8 rounded-xl flex flex-col md:flex-row justify-between items-center shadow-lg gap-4 text-center md:text-left">
        <div>
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-wider">Car Wash Manager</h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">Services & Detailing</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
           <button onClick={handleRefresh} disabled={isRefreshing} className={`w-full md:w-auto bg-white text-black text-[10px] font-bold px-4 py-3 rounded-lg hover:bg-gray-200 transition-all ${isRefreshing ? 'opacity-70 cursor-wait' : ''}`}>
             {isRefreshing ? 'Loading...' : 'Refresh ↻'}
           </button>
           <button onClick={handleUploadData} className="w-full md:w-auto bg-white/10 text-white text-[10px] font-bold px-4 py-3 rounded-lg border border-white/20 hover:bg-white/20 transition-all">
             SEED WASH DATA
           </button>
        </div>
      </div>

      {/* FORM */}
      <div className={`p-6 rounded-xl border ${editingId ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-100">
          <h3 className="font-bold text-lg text-black">{editingId ? '✏️ Edit Service' : 'Add New Service'}</h3>
          <div className="flex gap-2 items-center">
             <button onClick={() => { setTempCats(categories.filter(c => c.id !== 'all')); setShowCatModal(true); }} className="text-[10px] font-bold uppercase bg-black text-white px-3 py-2 rounded hover:bg-gray-800">Edit Categories</button>
             {editingId && <button onClick={cancelEditing} className="text-xs text-red-500 font-bold underline">Cancel Edit</button>}
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
           
           {/* IMAGE UPLOAD */}
           <div className="md:col-span-12">
             <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
               {isUploading ? "Uploading Image..." : "Service Image (Upload or URL)"}
             </label>
             <div className="flex gap-2">
               <input type="file" accept="image/*" onChange={handleFileUpload} className={`${inputStyle} w-1/2 cursor-pointer border-dashed`} />
               <input value={newItem.image || ''} onChange={e=>setNewItem({...newItem, image: e.target.value})} className={`${inputStyle} w-1/2 bg-gray-50`} placeholder="https://..." />
             </div>
           </div>

           {/* ORDER INPUT */}
           <div className="md:col-span-2">
              <label className="text-[10px] font-bold text-blue-600 uppercase block mb-1">Display Order</label>
              <input type="number" value={newItem.order ?? 10} onChange={e=>setNewItem({...newItem, order: parseInt(e.target.value) || 0})} className={`${inputStyle} border-blue-200 bg-blue-50 font-bold text-center`} placeholder="1" />
           </div>

           {/* NAME */}
           <div className="md:col-span-3">
             <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Service Name</label>
             <input value={newItem.name || ''} onChange={e=>setNewItem({...newItem, name: e.target.value})} className={inputStyle} placeholder="e.g. VIP Wash" />
           </div>

           {/* PRICE */}
           <div className="md:col-span-2">
             <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Price</label>
             <input value={newItem.price || ''} onChange={e=>setNewItem({...newItem, price: e.target.value})} className={inputStyle} placeholder="$0.00" />
           </div>

           {/* DISCOUNT */}
           <div className="md:col-span-3">
             <label className="text-[10px] font-bold text-red-500 uppercase block mb-1">Discount</label>
             <div className="flex gap-2">
               <input type="number" value={newItem.discountValue || ''} onChange={e=>setNewItem({...newItem, discountValue: e.target.value})} className={`${inputStyle} w-2/3`} placeholder="0" />
               <select value={newItem.discountType} onChange={e=>setNewItem({...newItem, discountType: e.target.value})} className={`${selectStyle} w-1/3 px-1 text-center`}>
                 <option value="percent">% Off</option>
                 <option value="fixed">$ Off</option>
               </select>
             </div>
           </div>

           {/* FINAL PRICE PREVIEW */}
           <div className="md:col-span-2 text-center pb-2">
             <p className="text-[10px] text-gray-400 uppercase font-bold">Final Price</p>
             <p className="text-xl font-bold text-green-600">{calculateFinalPrice(newItem.price, newItem.discountValue, newItem.discountType)}</p>
           </div>
           
           {/* CATEGORY */}
           <div className="md:col-span-3">
             <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Category</label>
             <select value={newItem.category || 'wash'} onChange={e=>setNewItem({...newItem, category: e.target.value})} className={selectStyle}>
               {categories.filter(c => c.id !== 'all').map(c => (
                 <option key={c.id} value={c.id}>{c.label}</option>
               ))}
             </select>
           </div>
           
           {/* DURATION */}
           <div className="md:col-span-2">
             <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Duration</label>
             <input value={newItem.duration || ''} onChange={e=>setNewItem({...newItem, duration: e.target.value})} className={inputStyle} placeholder="30 min" />
           </div>

           {/* DESCRIPTION */}
           <div className="md:col-span-7">
             <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Service Description</label>
             <input value={newItem.description || ''} onChange={e=>setNewItem({...newItem, description: e.target.value})} className={inputStyle} placeholder="Describe details..." />
           </div>

           {/* SUBMIT BUTTON */}
           <button disabled={isUploading} className={`md:col-span-12 w-full text-white font-bold py-4 uppercase text-xs tracking-widest ${isUploading ? 'bg-gray-400' : (editingId ? 'bg-amber-600' : 'bg-black')}`}>
             {isUploading ? 'Wait for upload...' : (editingId ? 'Update Service' : 'Add Service +')}
           </button>

        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button key={cat.id} onClick={() => setActiveFilter(cat.id)} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase transition-all border ${activeFilter === cat.id ? 'bg-black text-white' : 'bg-white text-gray-400 border-gray-200'}`}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-[10px] font-bold uppercase text-gray-400 tracking-widest">
              <tr>
                <th className="px-6 py-4">Ord</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Image</th>
                <th className="px-6 py-4">Service Details</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4 text-center">Tags</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredServices.map((s) => (
                <tr key={s.id} className={`transition-all ${s.isPaused ? 'bg-gray-50 opacity-60 grayscale-50' : 'hover:bg-gray-50'}`}>
                  
                  <td className="px-6 py-4 text-blue-600 font-bold">{s.order || '-'}</td>
                  
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => toggleStatus(s.id, 'isPaused', s.isPaused)} 
                      className={`px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest border transition-all ${
                        s.isPaused 
                          ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' 
                          : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                      }`}
                    >
                      {s.isPaused ? 'Paused' : 'Active'}
                    </button>
                  </td>

                  <td className="px-6 py-4">
                    <div className="w-12 h-12 relative rounded border border-gray-100 overflow-hidden">
                      <Image 
                        src={s.image || washPlaceholder} 
                        alt="" 
                        fill 
                        sizes="48px" 
                        quality={75}
                        className="object-cover" 
                      />
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <p className={`font-bold uppercase text-xs ${s.isPaused ? 'text-gray-500 line-through' : 'text-black'}`}>
                      {s.name}
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase">{s.duration}</p>
                  </td>

                  <td className="px-6 py-4 font-bold">{s.price}</td>

                  <td className="px-6 py-4 text-center space-x-2">
                    <button onClick={() => toggleStatus(s.id, 'isMonthlyPromo', s.isMonthlyPromo)} className={`px-3 py-1 rounded-full text-[9px] font-bold border ${s.isMonthlyPromo ? 'bg-yellow-100 text-yellow-700' : 'text-gray-300'}`}>Promo</button>
                    <button onClick={() => toggleStatus(s.id, 'isSignature', s.isSignature)} className={`px-3 py-1 rounded-full text-[9px] font-bold border ${s.isSignature ? 'bg-purple-100 text-purple-700' : 'text-gray-300'}`}>Sign</button>
                  </td>

                  <td className="px-6 py-4 text-right space-x-4">
                    <button onClick={() => startEditing(s)} className="text-blue-500 font-bold uppercase text-[10px]">Edit</button>
                    <button onClick={async () => { if(confirm('Delete?')) { await deleteDoc(doc(db, "carwash", s.id)); fetchServices(); } }} className="text-gray-300 hover:text-red-500 font-bold uppercase text-[10px]">Del</button>
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