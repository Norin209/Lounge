'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { auth, db } from '../_utils/firebase'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore'; 
import { uploadFullServices } from '../_utils/uploadFullServices'; 

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // 🟢 UNDO STATE
  const [lastSyncIds, setLastSyncIds] = useState<string[]>([]);
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/login');
      } else {
        setUser(currentUser);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    if (confirm("Log out of Admin Dashboard?")) {
      try {
        await signOut(auth);
        router.push('/login');
      } catch (error) {
        console.error("Logout Error:", error);
      }
    }
  };

  // 🟢 MASTER UPLOAD (Fixed TypeScript Error)
  const handleMasterUpload = async () => {
    if (!confirm("⚠️ This will scan and add missing services. Duplicates are skipped. Continue?")) return;

    setIsUploading(true);
    const result = await uploadFullServices();

    if (result.success && result.addedIds) {
        setLastSyncIds(result.addedIds);
        
        // 🟢 FIX: Use (result.count || 0) to handle undefined safely
        const count = result.count || 0;

        if (count > 0) {
            alert(`✅ Added ${count} new services!\n\n(You can UNDO this action immediately if needed)`);
            window.location.reload(); 
        } else {
            alert("✅ Database is already up to date.");
        }
    } else {
        alert("❌ Error syncing database.");
    }
    setIsUploading(false);
  };

  // 🟢 UNDO FUNCTION
  const handleUndoSync = async () => {
    if (!confirm(`⚠️ Undo last sync? This will DELETE the ${lastSyncIds.length} items you just added.`)) return;
    
    setIsUploading(true);
    try {
      await Promise.all(lastSyncIds.map(id => deleteDoc(doc(db, "services", id))));
      
      alert("✅ Undo Successful. Items removed.");
      setLastSyncIds([]); 
      window.location.reload();
      
    } catch (error) {
      console.error("Undo failed", error);
      alert("❌ Undo failed. Check console.");
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-100">
        <div className="animate-spin h-8 w-8 border-4 border-black border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const isActive = (path: string) => pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      
      {/* 📱 MOBILE HEADER */}
      <div className="md:hidden bg-black text-white sticky top-0 z-50 shadow-md">
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <span className="font-bold text-sm tracking-widest uppercase">Glisten Admin</span>
          
          <div className="flex gap-2">
             {/* UNDO BUTTON IF HISTORY EXISTS */}
             {lastSyncIds.length > 0 ? (
               <button 
                onClick={handleUndoSync}
                disabled={isUploading}
                className="text-[9px] font-bold uppercase text-white bg-red-600 px-3 py-1.5 rounded hover:bg-red-700 transition-all"
               >
                 ↩ Undo ({lastSyncIds.length})
               </button>
             ) : (
               <button 
                 onClick={handleMasterUpload}
                 disabled={isUploading}
                 className="text-[9px] font-bold uppercase text-yellow-500 border border-yellow-500/50 bg-yellow-900/10 px-3 py-1.5 rounded hover:bg-yellow-900/30 transition-all disabled:opacity-50"
               >
                 {isUploading ? 'Syncing...' : '⚡ Sync DB'}
               </button>
             )}

            <button 
              onClick={handleLogout} 
              className="text-[9px] font-bold uppercase text-gray-400 border border-gray-700 bg-gray-900 px-3 py-1.5 rounded hover:bg-gray-800 transition-all"
            >
              Exit
            </button>
          </div>
        </div>

        <div className="flex justify-around items-center p-3 bg-zinc-900 text-[10px] font-bold tracking-wider uppercase">
          <Link href="/admin/bookings" className={`transition-colors ${isActive('/admin/bookings') ? 'text-white border-b-2 border-white pb-0.5' : 'text-gray-500 hover:text-gray-300'}`}>Bookings</Link>
          <Link href="/admin/services" className={`transition-colors ${isActive('/admin/services') ? 'text-white border-b-2 border-white pb-0.5' : 'text-gray-500 hover:text-gray-300'}`}>Menu</Link>
          <Link href="/admin/products" className={`transition-colors ${isActive('/admin/products') ? 'text-white border-b-2 border-white pb-0.5' : 'text-gray-500 hover:text-gray-300'}`}>Shop</Link>
        </div>
      </div>

      {/* 🖥️ DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-black text-white min-h-screen fixed left-0 top-0 p-8">
        <div className="mb-12">
          <h2 className="text-xl font-playfair font-bold tracking-[0.2em] uppercase">Glisten</h2>
          <p className="text-[9px] text-gray-500 tracking-[0.3em] uppercase mt-2">Management</p>
        </div>

        <nav className="flex flex-col gap-3 flex-1">
          <Link href="/admin/bookings" className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${isActive('/admin/bookings') ? 'bg-white text-black font-bold' : 'text-gray-400 hover:text-white hover:bg-zinc-900'}`}>
            <span className="text-xs uppercase tracking-widest">📅 Bookings</span>
          </Link>

          <Link href="/admin/services" className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${isActive('/admin/services') ? 'bg-white text-black font-bold' : 'text-gray-400 hover:text-white hover:bg-zinc-900'}`}>
            <span className="text-xs uppercase tracking-widest">💅 Services</span>
          </Link>

          <Link href="/admin/products" className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${isActive('/admin/products') ? 'bg-white text-black font-bold' : 'text-gray-400 hover:text-white hover:bg-zinc-900'}`}>
            <span className="text-xs uppercase tracking-widest">🧴 Apothecary</span>
          </Link>
        </nav>

        <div className="mt-auto space-y-4">
          
          {/* DESKTOP BUTTONS: Toggle between Sync and Undo */}
          {lastSyncIds.length > 0 ? (
             <button 
               onClick={handleUndoSync}
               disabled={isUploading}
               className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all shadow-md"
             >
               <span className="text-[10px] font-bold uppercase tracking-widest">
                 {isUploading ? 'Undoing...' : `↩ Undo Last Sync (${lastSyncIds.length})`}
               </span>
             </button>
          ) : (
             <button 
               onClick={handleMasterUpload} 
               disabled={isUploading}
               className="w-full flex items-center justify-center gap-2 px-4 py-3 text-yellow-500 border border-yellow-900/30 hover:bg-yellow-900/10 rounded-lg transition-all disabled:opacity-50"
             >
               <span className="text-[10px] font-bold uppercase tracking-widest">
                 {isUploading ? 'Syncing...' : '⚡ Sync Database'}
               </span>
             </button>
          )}

          <button 
            onClick={handleLogout} 
            className="w-full flex items-center gap-4 px-4 py-4 text-red-500 hover:text-red-400 border-t border-zinc-800 transition-all"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">🚪 Logout</span>
          </button>
        </div>
      </aside>

      {/* 📄 MAIN CONTENT AREA */}
      <main className="flex-1 md:ml-64 p-4 md:p-10">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

    </div>
  );
}