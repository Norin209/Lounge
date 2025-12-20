'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { auth } from '../_utils/firebase'; // Ensure this path matches your structure
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

  // 🔒 SECURITY CHECK
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        // If not logged in, kick them to login page
        router.push('/login');
      } else {
        // If logged in, let them stay
        setUser(currentUser);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // 🚪 LOGOUT FUNCTION
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  // While checking security, show a loading spinner instead of the content
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-100">
        <div className="animate-spin h-8 w-8 border-4 border-black border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Helper to check active links
  const isActive = (path: string) => pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      
      {/* 📱 MOBILE HEADER (Visible on Small Screens) */}
      <div className="md:hidden bg-black text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <span className="font-bold text-sm tracking-widest uppercase">Glisten Admin</span>
        <div className="flex gap-4 text-xs font-bold tracking-wider">
          <Link href="/admin/bookings" className={isActive('/admin/bookings') ? 'text-white' : 'text-gray-400'}>
            Bookings
          </Link>
          <Link href="/admin/services" className={isActive('/admin/services') ? 'text-white' : 'text-gray-400'}>
            Menu
          </Link>
          {/* 🔴 NEW MOBILE LOGOUT BUTTON */}
          <button onClick={handleLogout} className="text-red-500 hover:text-red-400">
            Logout
          </button>
        </div>
      </div>

      {/* 🖥️ DESKTOP SIDEBAR (Visible on Large Screens) */}
      <aside className="hidden md:flex flex-col w-64 bg-black text-white min-h-screen fixed left-0 top-0 p-6">
        <div className="mb-10">
          <h2 className="text-xl font-bold tracking-[0.2em] uppercase">Glisten</h2>
          <p className="text-[10px] text-gray-400 tracking-widest uppercase mt-1">Management Console</p>
        </div>

        <nav className="flex flex-col gap-4 flex-1">
          <Link 
            href="/admin/bookings" 
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/admin/bookings') ? 'bg-white text-black font-bold' : 'text-gray-400 hover:text-white hover:bg-zinc-900'}`}
          >
            <span>📅</span>
            <span className="text-xs uppercase tracking-widest">Bookings</span>
          </Link>

          <Link 
            href="/admin/services" 
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/admin/services') ? 'bg-white text-black font-bold' : 'text-gray-400 hover:text-white hover:bg-zinc-900'}`}
          >
            <span>💅</span>
            <span className="text-xs uppercase tracking-widest">Services & Menu</span>
          </Link>
        </nav>

        {/* Desktop Logout */}
        <button 
          onClick={handleLogout} 
          className="flex items-center gap-3 px-4 py-3 text-red-500 hover:text-red-400 hover:bg-zinc-900 rounded-lg transition-all mt-auto"
        >
          <span>🚪</span>
          <span className="text-xs font-bold uppercase tracking-widest">Logout</span>
        </button>
      </aside>

      {/* 📄 MAIN CONTENT AREA */}
      <main className="flex-1 md:ml-64 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>

    </div>
  );
}