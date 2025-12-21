'use client';

import { useEffect, useState } from 'react';
import { db } from '../../_utils/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export default function AdminBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); // 🟢 For Refresh Animation

  // 1. LISTEN TO LIVE BOOKINGS
  useEffect(() => {
    fetchLiveBookings();
  }, []);

  const fetchLiveBookings = () => {
    setLoading(true);
    const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBookings(list);
      setLoading(false);
      setIsRefreshing(false);
    });
    return unsubscribe;
  };

  // 🔄 MANUAL REFRESH FUNCTION
  const handleRefresh = () => {
    setIsRefreshing(true);
    // onSnapshot is live, but this gives visual feedback and re-checks connection
    setTimeout(() => fetchLiveBookings(), 500);
  };

  // 2. CHANGE STATUS FUNCTION
  const updateStatus = async (id: string, newStatus: string) => {
    if (newStatus === 'cancelled' && !confirm("Mark this booking as Cancelled?")) return;
    await updateDoc(doc(db, "bookings", id), { status: newStatus });
  };

  // ↩️ UNDO FUNCTION (Resets to Pending)
  const undoStatus = async (id: string) => {
    if (confirm("Undo status change? This will set the booking back to PENDING.")) {
      await updateDoc(doc(db, "bookings", id), { status: 'pending' });
    }
  };

  // 3. PERMANENT DELETE
  const deleteBooking = async (id: string) => {
    if (confirm("⚠️ Are you sure? This will PERMANENTLY delete this record.")) {
      await deleteDoc(doc(db, "bookings", id));
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-400 text-xs uppercase tracking-widest">Loading Requests...</div>;

  return (
    <div className="space-y-8 pb-20">
      
      {/* HEADER */}
      <div className="bg-black text-white p-8 rounded-xl flex flex-col md:flex-row justify-between items-center shadow-lg gap-4">
        <div>
          <h1 className="text-2xl font-bold font-playfair mb-1">Incoming Bookings</h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Real-time Customer Requests</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-white/10 px-4 py-2 rounded-lg text-xs font-bold">
            {bookings.length} Requests
          </div>
          
          {/* 🔄 REFRESH BUTTON */}
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`
              bg-white text-black px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center gap-2
              ${isRefreshing ? 'opacity-50 cursor-wait' : ''}
            `}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh List ↻'}
          </button>
        </div>
      </div>

      {/* BOOKINGS LIST */}
      <div className="space-y-4">
        {bookings.map((booking) => (
          <div key={booking.id} className={`p-6 rounded-xl border shadow-sm flex flex-col md:flex-row gap-6 transition-all ${booking.status === 'cancelled' ? 'bg-gray-50 border-gray-200 opacity-75' : 'bg-white border-gray-100 hover:shadow-md'}`}>
            
            {/* DATE & TIME BOX */}
            <div className="md:w-32 shrink-0 flex flex-col justify-center items-center bg-gray-50 rounded-lg p-4 border border-gray-100 text-center">
               <span className="text-xs font-bold text-gray-400 uppercase mb-1">{booking.date}</span>
               <span className="text-xl font-bold text-black font-playfair">{booking.time}</span>
               
               {/* STATUS BADGE */}
               <span className={`mt-2 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider ${
                 booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                 booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                 booking.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                 'bg-yellow-100 text-yellow-700'
               }`}>
                 {booking.status}
               </span>
            </div>

            {/* CUSTOMER INFO */}
            <div className="flex-1 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className={`text-lg font-bold ${booking.status === 'cancelled' ? 'text-gray-400 line-through' : 'text-black'}`}>
                    {booking.customerName}
                  </h3>
                  <a href={`tel:${booking.customerPhone}`} className="text-xs text-gray-500 hover:text-black hover:underline font-bold tracking-wide">
                    {booking.customerPhone}
                  </a>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">{booking.branch}</p>
                </div>
                
                {/* 🎮 ACTION BUTTONS */}
                <div className="flex flex-wrap items-center gap-2 justify-end">
                  
                  {/* CONFIRM (Only if pending) */}
                  {booking.status === 'pending' && (
                    <button onClick={() => updateStatus(booking.id, 'confirmed')} className="bg-black text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 shadow-sm">
                      Confirm
                    </button>
                  )}

                  {/* COMPLETE (Only if confirmed) */}
                  {booking.status === 'confirmed' && (
                    <button onClick={() => updateStatus(booking.id, 'completed')} className="border border-green-200 text-green-600 bg-green-50 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-green-100">
                      Complete
                    </button>
                  )}

                  {/* CANCEL (Visible unless already cancelled or completed) */}
                  {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                    <button onClick={() => updateStatus(booking.id, 'cancelled')} className="border border-gray-200 text-gray-500 bg-white px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                      Cancel
                    </button>
                  )}
                  
                  {/* ↩️ UNDO BUTTON (Visible if NOT pending) - Resets mistake */}
                  {booking.status !== 'pending' && (
                    <button 
                      onClick={() => undoStatus(booking.id)} 
                      className="text-blue-400 hover:text-blue-600 font-bold text-[10px] uppercase tracking-widest underline decoration-transparent hover:decoration-blue-400 transition-all p-2"
                      title="Undo Status Change"
                    >
                      Undo
                    </button>
                  )}

                  {/* 🗑️ DELETE (Always visible) */}
                  <button 
                    onClick={() => deleteBooking(booking.id)} 
                    className="text-gray-300 hover:text-red-600 font-bold text-[10px] uppercase tracking-widest underline decoration-transparent hover:decoration-red-600 transition-all p-2"
                    title="Permanently Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* SERVICES LIST */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Requested Services</p>
                <ul className="space-y-1">
                  {Array.isArray(booking.services) ? (
                    booking.services.map((s: any, i: number) => (
                      <li key={i} className="text-sm text-gray-700 font-medium flex justify-between">
                        <span>• {typeof s === 'object' ? s.name : s}</span>
                        {typeof s === 'object' && <span className="text-gray-400 text-xs">{s.price}</span>}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-gray-500 italic">No services listed</li>
                  )}
                </ul>
                
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