'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { auth } from '../_utils/firebase'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  // 🔒 SECURITY CHECK: Ensure only logged-in users access admin
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
      
      {/* 📱 MOBILE HEADER (Redesigned for easy Logout) */}
      <div className="md:hidden bg-black text-white sticky top-0 z-50 shadow-md">
        {/* Top Row: Brand & Logout */}
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <span className="font-bold text-sm tracking-widest uppercase">Glisten Admin</span>
          <button 
            onClick={handleLogout} 
            className="text-[10px] font-bold uppercase text-red-400 border border-red-900/50 bg-red-900/10 px-3 py-1.5 rounded hover:bg-red-900/30 transition-all"
          >
            Logout ➜
          </button>
        </div>

        {/* Bottom Row: Navigation Tabs */}
        <div className="flex justify-around items-center p-3 bg-zinc-900 text-[10px] font-bold tracking-wider uppercase">
          <Link 
            href="/admin/bookings" 
            className={`transition-colors ${isActive('/admin/bookings') ? 'text-white border-b-2 border-white pb-0.5' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Bookings
          </Link>
          <Link 
            href="/admin/services" 
            className={`transition-colors ${isActive('/admin/services') ? 'text-white border-b-2 border-white pb-0.5' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Menu
          </Link>
          <Link 
            href="/admin/products" 
            className={`transition-colors ${isActive('/admin/products') ? 'text-white border-b-2 border-white pb-0.5' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Shop
          </Link>
        </div>
      </div>

      {/* 🖥️ DESKTOP SIDEBAR (Unchanged) */}
      <aside className="hidden md:flex flex-col w-64 bg-black text-white min-h-screen fixed left-0 top-0 p-8">
        <div className="mb-12">
          <h2 className="text-xl font-playfair font-bold tracking-[0.2em] uppercase">Glisten</h2>
          <p className="text-[9px] text-gray-500 tracking-[0.3em] uppercase mt-2">Management</p>
        </div>

        <nav className="flex flex-col gap-3 flex-1">
          <Link 
            href="/admin/bookings" 
            className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${isActive('/admin/bookings') ? 'bg-white text-black font-bold' : 'text-gray-400 hover:text-white hover:bg-zinc-900'}`}
          >
            <span className="text-xs uppercase tracking-widest">📅 Bookings</span>
          </Link>

          <Link 
            href="/admin/services" 
            className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${isActive('/admin/services') ? 'bg-white text-black font-bold' : 'text-gray-400 hover:text-white hover:bg-zinc-900'}`}
          >
            <span className="text-xs uppercase tracking-widest">💅 Services</span>
          </Link>

          <Link 
            href="/admin/products" 
            className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${isActive('/admin/products') ? 'bg-white text-black font-bold' : 'text-gray-400 hover:text-white hover:bg-zinc-900'}`}
          >
            <span className="text-xs uppercase tracking-widest">🧴 Apothecary</span>
          </Link>
        </nav>

        {/* Logout */}
        <button 
          onClick={handleLogout} 
          className="flex items-center gap-4 px-4 py-4 text-red-500 hover:text-red-400 border-t border-zinc-800 transition-all mt-auto"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">🚪 Logout</span>
        </button>
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