'use client';

import { useEffect, useState } from 'react';
import { db } from '../../_utils/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';

export default function AdminBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. LISTEN TO LIVE BOOKINGS
  useEffect(() => {
    const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBookings(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. CHANGE STATUS FUNCTION
  const updateStatus = async (id: string, newStatus: string) => {
    await updateDoc(doc(db, "bookings", id), { status: newStatus });
  };

  if (loading) return <div className="p-10 text-center text-gray-400 text-xs uppercase tracking-widest">Loading Requests...</div>;

  return (
    <div className="space-y-8 pb-20">
      
      {/* HEADER */}
      <div className="bg-black text-white p-8 rounded-xl flex flex-col md:flex-row justify-between items-center shadow-lg">
        <div>
          <h1 className="text-2xl font-bold font-playfair mb-1">Incoming Bookings</h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Real-time Customer Requests</p>
        </div>
        <div className="mt-4 md:mt-0 bg-white/10 px-4 py-2 rounded-lg text-xs font-bold">
          {bookings.length} Total Requests
        </div>
      </div>

      {/* BOOKINGS LIST */}
      <div className="space-y-4">
        {bookings.map((booking) => (
          <div key={booking.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6">
            
            {/* DATE & TIME BOX */}
            <div className="md:w-32 shrink-0 flex flex-col justify-center items-center bg-gray-50 rounded-lg p-4 border border-gray-100 text-center">
               <span className="text-xs font-bold text-gray-400 uppercase mb-1">{booking.date}</span>
               <span className="text-xl font-bold text-black font-playfair">{booking.time}</span>
               <span className={`mt-2 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider ${
                 booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                 booking.status === 'completed' ? 'bg-gray-100 text-gray-500' :
                 'bg-yellow-100 text-yellow-700'
               }`}>
                 {booking.status}
               </span>
            </div>

            {/* CUSTOMER INFO */}
            <div className="flex-1 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-black">{booking.customerName}</h3>
                  <a href={`tel:${booking.customerPhone}`} className="text-xs text-gray-500 hover:text-black hover:underline font-bold tracking-wide">
                    {booking.customerPhone}
                  </a>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">{booking.branch}</p>
                </div>
                
                {/* ACTIONS */}
                <div className="flex gap-2">
                  {booking.status === 'pending' && (
                    <button onClick={() => updateStatus(booking.id, 'confirmed')} className="bg-black text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800">
                      Confirm
                    </button>
                  )}
                  {booking.status === 'confirmed' && (
                    <button onClick={() => updateStatus(booking.id, 'completed')} className="border border-gray-200 text-gray-400 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-green-50 hover:text-green-600 hover:border-green-200">
                      Complete
                    </button>
                  )}
                </div>
              </div>

              {/* SERVICES LIST - THIS WAS THE CAUSE OF THE ERROR */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Requested Services</p>
                <ul className="space-y-1">
                  {/* We now check if it's an array of objects or strings to prevent errors */}
                  {Array.isArray(booking.services) ? (
                    booking.services.map((s: any, i: number) => (
                      <li key={i} className="text-sm text-gray-700 font-medium flex justify-between">
                        {/* 🛑 SAFELY RENDER: If s is object, use s.name. If s is string, use s. */}
                        <span>• {typeof s === 'object' ? s.name : s}</span>
                        {typeof s === 'object' && <span className="text-gray-400 text-xs">{s.price}</span>}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-gray-500 italic">No services listed</li>
                  )}
                </ul>
                
                {/* TOTAL PRICE */}
                {booking.totalPrice && (
                  <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Est. Total</span>
                    <span className="text-sm font-bold text-green-600">${Number(booking.totalPrice).toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* NOTES */}
              {booking.notes && (
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-xs text-yellow-800">
                  <span className="font-bold uppercase tracking-wide mr-2">Note:</span> {booking.notes}
                </div>
              )}
            </div>

          </div>
        ))}

        {bookings.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-400 text-xs uppercase tracking-widest">No bookings found yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}