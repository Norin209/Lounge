'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../_utils/firebase';

export default function LoginPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 🔒 HARDCODED ADMIN EMAIL (The user won't see this)
  // Make sure this matches the email you created in Firebase!
  const ADMIN_EMAIL = "admin@glisten.com"; 

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // We use the PIN as the password
      await signInWithEmailAndPassword(auth, ADMIN_EMAIL, pin);
      router.push('/admin/bookings');
    } catch (err) {
      console.error(err);
      setError('Incorrect PIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-sm w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="text-center mb-10">
          <h1 className="text-xl font-bold font-playfair mb-2">Glisten Admin</h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">Security Check</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 text-center">
              Enter Access PIN
            </label>
            <input 
              type="password" 
              required
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              // ✅ No Placeholder, centered text for PIN look
              className="w-full bg-gray-50 border-b-2 border-gray-200 text-center text-2xl font-bold tracking-[0.5em] p-4 outline-none focus:border-black transition-colors"
              maxLength={6} 
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-500 text-[10px] font-bold uppercase tracking-wide rounded text-center">
              {error}
            </div>
          )}

          <button 
            disabled={loading}
            className="w-full bg-black text-white font-bold text-[10px] uppercase tracking-[0.2em] py-4 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Unlock Console'}
          </button>
        </form>
      </div>
    </div>
  );
}