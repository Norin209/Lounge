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
    if (!confirm('Log out of Admin Dashboard?')) return;

    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };

  const handleMasterUpload = async () => {
    if (!confirm('⚠️ Sync database with Master Menu?')) return;

    setIsUploading(true);

    try {
      const result = await uploadFullServices();

      if (result.success && result.addedIds) {
        setLastSyncIds(result.addedIds);

        alert(`✅ Added ${result.count || 0} items!`);

        window.location.reload();
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUndoSync = async () => {
    if (
      !confirm(
        `⚠️ Undo last sync? This will DELETE ${lastSyncIds.length} items.`
      )
    ) {
      return;
    }

    setIsUploading(true);

    try {
      await Promise.all(
        lastSyncIds.map((id) => deleteDoc(doc(db, 'services', id)))
      );

      alert('✅ Undo Successful.');

      setLastSyncIds([]);

      window.location.reload();
    } catch (error) {
      console.error('Undo failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  /*
   * Also keeps menu highlighted for future nested pages:
   * /admin/expenses/123
   * /admin/bookings/123
   */
  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(`${path}/`);

  const navLinks = [
    {
      name: 'Bookings',
      path: '/admin/bookings',
      icon: '📅',
    },
    {
      name: 'Expenses',
      path: '/admin/expenses',
      icon: '💸',
    },
    {
      name: 'Services',
      path: '/admin/services',
      icon: '💅',
    },
    {
      name: 'Promo Codes',
      path: '/admin/promos',
      icon: '🏷️',
    },
    {
      name: 'Apothecary',
      path: '/admin/products',
      icon: '🧴',
    },
    {
      name: 'Cafe Menu',
      path: '/admin/cafe',
      icon: '☕',
    },
    {
      name: 'Car Wash',
      path: '/admin/carwash',
      icon: '🚗',
    },
  ];

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      
      {/* =========================
          MOBILE NAVIGATION
      ========================== */}
      <div className="md:hidden bg-black text-white sticky top-0 z-50 shadow-md">
        
        <div className="flex justify-between items-center p-4">
          <div>
            <span className="font-bold text-xs uppercase tracking-widest">
              Premier Admin
            </span>
          </div>

          <div className="flex gap-2">
            {lastSyncIds.length > 0 ? (
              <button
                onClick={handleUndoSync}
                disabled={isUploading}
                className="text-[9px] font-bold uppercase bg-red-600 px-3 py-1 rounded disabled:opacity-50"
              >
                {isUploading ? 'Working...' : 'Undo'}
              </button>
            ) : (
              <button
                onClick={handleMasterUpload}
                disabled={isUploading}
                className="text-[9px] font-bold uppercase text-yellow-500 border border-yellow-500/50 bg-yellow-900/10 px-3 py-1 rounded disabled:opacity-50"
              >
                {isUploading ? 'Syncing...' : 'Sync'}
              </button>
            )}

            <button
              onClick={handleLogout}
              className="text-[9px] font-bold uppercase text-gray-400 bg-gray-900 px-3 py-1 rounded"
            >
              Exit
            </button>
          </div>
        </div>

        {/* MOBILE SCROLL MENU */}
        <div className="flex overflow-x-auto p-3 bg-zinc-900 text-[10px] gap-5 px-6">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={`
                whitespace-nowrap
                pb-1
                transition-all
                ${
                  isActive(link.path)
                    ? 'text-white border-b border-white'
                    : 'text-gray-500 hover:text-gray-300'
                }
              `}
            >
              {link.icon} {link.name}
            </Link>
          ))}
        </div>
      </div>

      {/* =========================
          DESKTOP SIDEBAR
      ========================== */}
      <aside className="hidden md:flex flex-col w-64 bg-black text-white min-h-screen fixed left-0 top-0 p-8">
        
        {/* BRAND */}
        <div className="mb-12">
          <h2 className="text-xl font-bold uppercase tracking-widest">
            Premier
          </h2>

          <p className="text-[9px] text-gray-500 uppercase tracking-widest">
            Master Hub
          </p>
        </div>

        {/* NAVIGATION */}
        <nav className="flex flex-col gap-2 flex-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={`
                flex
                items-center
                gap-4
                px-4
                py-3
                rounded-lg
                transition-all
                ${
                  isActive(link.path)
                    ? 'bg-white text-black font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-zinc-900'
                }
              `}
            >
              <span className="text-xs">
                {link.icon}
              </span>

              <span className="text-[10px] uppercase tracking-widest">
                {link.name}
              </span>
            </Link>
          ))}
        </nav>

        {/* BOTTOM ACTIONS */}
        <div className="mt-auto pt-4 border-t border-zinc-800 space-y-4">
          
          {lastSyncIds.length > 0 ? (
            <button
              onClick={handleUndoSync}
              disabled={isUploading}
              className="w-full text-[10px] font-bold uppercase p-3 bg-red-600 rounded-lg disabled:opacity-50"
            >
              {isUploading
                ? 'Working...'
                : `Undo Sync (${lastSyncIds.length})`}
            </button>
          ) : (
            <button
              onClick={handleMasterUpload}
              disabled={isUploading}
              className="w-full text-[10px] font-bold uppercase p-3 text-yellow-500 border border-yellow-900/30 rounded-lg hover:bg-yellow-900/10 disabled:opacity-50"
            >
              {isUploading ? 'Syncing...' : '⚡ Sync DB'}
            </button>
          )}

          <button
            onClick={handleLogout}
            className="w-full text-left text-red-500 hover:text-red-400 text-[10px] font-bold uppercase px-4 transition"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* =========================
          ADMIN PAGE CONTENT
      ========================== */}
      <main className="flex-1 md:ml-64 p-4 md:p-10">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}