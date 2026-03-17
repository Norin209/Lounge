'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { auth, db } from '../_utils/firebase'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore'; 
import { uploadFullServices } from '../_utils/uploadFullServices'; 

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [lastSyncIds, setLastSyncIds] = useState<string[]>([]);
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) router.push('/login');
      else { setUser(currentUser); setLoading(false); }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    if (confirm("Log out of Admin Dashboard?")) {
      try { await signOut(auth); router.push('/login'); } 
      catch (error) { console.error("Logout Error:", error); }
    }
  };

  const handleMasterUpload = async () => {
    if (!confirm("⚠️ Sync database with Master Menu?")) return;
    setIsUploading(true);
    const result = await uploadFullServices();
    if (result.success && result.addedIds) {
        setLastSyncIds(result.addedIds);
        alert(`✅ Added ${result.count || 0} items!`);
        window.location.reload(); 
    }
    setIsUploading(false);
  };

  const handleUndoSync = async () => {
    if (!confirm(`⚠️ Undo last sync? This will DELETE ${lastSyncIds.length} items.`)) return;
    setIsUploading(true);
    try {
      await Promise.all(lastSyncIds.map(id => deleteDoc(doc(db, "services", id))));
      alert("✅ Undo Successful.");
      setLastSyncIds([]); 
      window.location.reload();
    } catch (error) { console.error("Undo failed", error); } 
    finally { setIsUploading(false); }
  };

  const isActive = (path: string) => pathname === path;
  const navLinks = [
    { name: 'Bookings', path: '/admin/bookings', icon: '📅' },
    { name: 'Services', path: '/admin/services', icon: '💅' },
    { name: 'Apothecary', path: '/admin/products', icon: '🧴' },
    { name: 'Cafe Menu', path: '/admin/cafe', icon: '☕' },
    { name: 'Car Wash', path: '/admin/carwash', icon: '🚗' },
  ];

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* MOBILE NAV */}
      <div className="md:hidden bg-black text-white sticky top-0 z-50 shadow-md">
        <div className="flex justify-between items-center p-4">
          <span className="font-bold text-xs uppercase">Premier Admin</span>
          <div className="flex gap-2">
             {lastSyncIds.length > 0 ? (
               <button onClick={handleUndoSync} className="text-[9px] font-bold uppercase bg-red-600 px-3 py-1 rounded">Undo</button>
             ) : (
               <button onClick={handleMasterUpload} className="text-[9px] font-bold uppercase text-yellow-500 border border-yellow-500/50 bg-yellow-900/10 px-3 py-1 rounded">Sync</button>
             )}
            <button onClick={handleLogout} className="text-[9px] font-bold uppercase text-gray-400 bg-gray-900 px-3 py-1 rounded">Exit</button>
          </div>
        </div>
        <div className="flex overflow-x-auto p-3 bg-zinc-900 text-[10px] gap-4 px-6">
          {navLinks.map(link => (
            <Link key={link.path} href={link.path} className={`whitespace-nowrap ${isActive(link.path) ? 'text-white border-b border-white' : 'text-gray-500'}`}>{link.name}</Link>
          ))}
        </div>
      </div>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-black text-white min-h-screen fixed left-0 top-0 p-8">
        <div className="mb-12"><h2 className="text-xl font-bold uppercase tracking-widest">Premier</h2><p className="text-[9px] text-gray-500 uppercase tracking-widest">Master Hub</p></div>
        <nav className="flex flex-col gap-2 flex-1">
          {navLinks.map(link => (
            <Link key={link.path} href={link.path} className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${isActive(link.path) ? 'bg-white text-black font-bold' : 'text-gray-400 hover:text-white hover:bg-zinc-900'}`}>
              <span className="text-xs uppercase tracking-widest">{link.icon} {link.name}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-4 border-t border-zinc-800 space-y-4">
          {lastSyncIds.length > 0 ? (
             <button onClick={handleUndoSync} className="w-full text-[10px] font-bold uppercase p-3 bg-red-600 rounded-lg">Undo Sync ({lastSyncIds.length})</button>
          ) : (
             <button onClick={handleMasterUpload} className="w-full text-[10px] font-bold uppercase p-3 text-yellow-500 border border-yellow-900/30 rounded-lg hover:bg-yellow-900/10">⚡ Sync DB</button>
          )}
          <button onClick={handleLogout} className="w-full text-left text-red-500 text-[10px] font-bold uppercase px-4">🚪 Logout</button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 p-4 md:p-10"><div className="max-w-6xl mx-auto">{children}</div></main>
    </div>
  );
}