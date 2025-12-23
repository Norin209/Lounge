'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useBag } from '../_context/BagContext'; 
import { db } from '../_utils/firebase'; 
import { collection, addDoc } from 'firebase/firestore'; 

// --- CALENDAR HELPERS ---
const DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const BookingPage = () => {
  const { bag, clearBag, removeFromBag } = useBag(); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const topRef = useRef<HTMLDivElement>(null);

  // --- 🕒 TIMEZONE HELPER ---
  const getNowInCambodia = () => {
    const now = new Date();
    const cambodiaTimeStr = now.toLocaleString("en-US", { timeZone: "Asia/Phnom_Penh" });
    return new Date(cambodiaTimeStr);
  };

  const todayInCambodia = getNowInCambodia();
  todayInCambodia.setHours(0, 0, 0, 0); 

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedDateObj, setSelectedDateObj] = useState<Date | null>(null); 
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: '', 
    time: '', 
    branch: 'HV8C+9C8, Phnom Penh Hanoi Friendship Blvd (1019), Phnom Penh', 
    notes: ''
  });

  useEffect(() => {
    if (isSuccess) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }, [isSuccess]);

  // 🟢 PRICE HELPER
  const parsePrice = (priceStr: string) => {
    if (!priceStr) return 0;
    const num = parseFloat(priceStr.toString().replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  // 🟢 CALCULATE TOTAL
  const finalTotal = useMemo(() => {
    return bag.reduce((sum: number, item: any) => sum + parsePrice(item.price), 0);
  }, [bag]);

  // --- CALENDAR LOGIC ---
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    if (newDate.getMonth() < todayInCambodia.getMonth() && newDate.getFullYear() <= todayInCambodia.getFullYear()) return;
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    if (newDate < todayInCambodia) return;
    setSelectedDateObj(newDate);
    setFormData({ ...formData, date: newDate.toLocaleDateString('en-CA'), time: '' });
  };

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let i = 7; i <= 21; i++) {
      slots.push(`${i}:00`);
      if (i !== 21) slots.push(`${i}:30`);
    }
    return slots; 
  }, []);

  const isTimeDisabled = (slot: string) => {
    if (!selectedDateObj) return true;
    if (selectedDateObj.toDateString() === todayInCambodia.toDateString()) {
      const now = getNowInCambodia();
      const [slotH, slotM] = slot.split(':').map(Number);
      if (slotH < now.getHours()) return true;
      if (slotH === now.getHours() && slotM < now.getMinutes()) return true;
    }
    return false;
  };

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleTimeSelect = (time: string) => !isTimeDisabled(time) && setFormData({ ...formData, time });

  // --- SUBMIT HANDLER ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const bookingData = {
      ...formData,
      services: bag.map((i: any) => ({ 
        name: i.name, 
        price: i.price,
        category: i.category || 'Standard' // Save category too
      })),
      totalPrice: finalTotal.toFixed(2), 
      createdAt: new Date(),
      status: 'pending'
    };

    try {
      await addDoc(collection(db, "bookings"), bookingData);
      
      // Send Telegram (Optional)
      try {
        await fetch('/.netlify/functions/booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `New Booking: ${formData.name} - $${finalTotal.toFixed(2)}` })
        });
      } catch (err) { console.log("Telegram notification skipped"); }

      setIsSuccess(true);
      if (clearBag) clearBag(); 
    } catch (error) {
      console.error('Submission Error:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const blanks = Array(firstDay).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 max-w-sm mx-auto select-none">
        <div className="flex justify-between items-center mb-6 px-2">
          <button type="button" onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-black">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <h3 className="text-lg font-bold text-gray-800">{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
          <button type="button" onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-black">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map(day => <div key={day} className="text-center text-[10px] font-bold text-gray-400 py-2">{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-y-2">
          {blanks.map((_, i) => <div key={`blank-${i}`} />)}
          {days.map(day => {
            const dateToCheck = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const isSelected = selectedDateObj?.getDate() === day && selectedDateObj?.getMonth() === currentDate.getMonth();
            const isPast = dateToCheck < todayInCambodia;
            return (
              <div key={day} className="flex justify-center">
                <button type="button" disabled={isPast} onClick={() => handleDateClick(day)}
                  className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium transition-all ${isSelected ? 'bg-[#E32626] text-white shadow-md scale-110' : isPast ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {day}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (isSuccess) {
    return (
      <div className="bg-zinc-50 min-h-screen font-sans">
        <div ref={topRef} />
        <div className="bg-black pt-32 pb-32 px-6 text-center">
          <h1 className="text-3xl md:text-5xl font-playfair text-white uppercase tracking-tight">Booking Received</h1>
          <p className="text-zinc-400 text-[10px] mt-4 tracking-[0.2em] uppercase font-light">Glisten Lounge Concierge</p>
        </div>
        <div className="max-w-md mx-auto px-6 -mt-20 relative z-10 mb-20">
          <div className="bg-white p-10 shadow-xl border border-gray-100 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 className="text-2xl font-playfair text-black mb-4 uppercase tracking-tight">Request Sent</h2>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              Thank you, <strong>{formData.name}</strong>. Our team will contact you at <strong>{formData.phone}</strong> shortly.
            </p>
            <Link href="/" className="block w-full bg-black text-white py-4 text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-zinc-800 transition-colors">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-50 min-h-screen pb-24 font-sans">
      <div ref={topRef} />
      <div className="bg-black pt-32 pb-32 px-6 text-center relative">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-500 mb-4 font-sans">Final Step</h3>
          <h1 className="text-3xl md:text-5xl font-playfair text-white uppercase tracking-tight">Secure Your Spot</h1>
          <p className="text-zinc-400 text-[10px] mt-4 tracking-[0.2em] font-light uppercase">No Payment Required Online</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 -mt-20 relative z-10">
        {bag.length > 0 ? (
          <div className="bg-white shadow-xl shadow-black/5 border border-gray-100 overflow-hidden flex flex-col lg:flex-row">
            <div className="p-8 md:p-12 w-full lg:w-3/5 order-2 lg:order-1 border-r border-gray-100">
              <h3 className="text-xl font-playfair font-bold text-black mb-8 text-center md:text-left">Book an appointment</h3>
              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                   <div className="w-full md:w-auto shrink-0">{renderCalendar()}</div>
                   <div className="w-full space-y-6">
                      <div className="grid grid-cols-1 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 font-sans">Full Name</label>
                            <input required name="name" type="text" value={formData.name} onChange={handleChange} placeholder="e.g. Jane Doe" className="w-full border-b border-gray-200 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-transparent placeholder:text-gray-300 font-sans" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 font-sans">Phone Number</label>
                            <input required name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="e.g. 012 345 678" className="w-full border-b border-gray-200 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-transparent placeholder:text-gray-300 font-sans" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 font-sans">Special Requests</label>
                            <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Any specific needs..." className="w-full border-b border-gray-200 py-3 text-sm focus:outline-none focus:border-black bg-transparent text-gray-700 resize-none h-20 font-sans placeholder:text-gray-300" />
                          </div>
                      </div>
                   </div>
                </div>

                <div className="border-t border-gray-100 pt-8">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 font-sans mb-1">Appointment Date:</h4>
                  <p className="text-3xl font-playfair font-bold text-black mb-6">{selectedDateObj ? selectedDateObj.toDateString() : 'Select a date'}</p>
                  
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {timeSlots.map((slot) => {
                       const disabled = isTimeDisabled(slot);
                       return (
                        <button key={slot} type="button" disabled={disabled} onClick={() => handleTimeSelect(slot)}
                          className={`py-3 px-2 rounded-lg text-xs font-medium transition-all duration-200 border ${formData.time === slot ? 'bg-black text-white border-black shadow-lg scale-105' : disabled ? 'bg-gray-100 text-gray-300 border-transparent cursor-not-allowed line-through' : 'bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100'}`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4">
                  <button type="submit" disabled={isSubmitting || !formData.date || !formData.time} className="w-full bg-black text-white py-4 text-[10px] font-bold tracking-[0.25em] uppercase hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-sans">
                    {isSubmitting ? 'Processing...' : `Confirm Request • $${finalTotal.toFixed(2)}`}
                  </button>
                </div>
              </form>
            </div>

            <div className="w-full lg:w-2/5 bg-zinc-50 border-l border-gray-100 p-8 order-1 lg:order-2">
              <div className="sticky top-8">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 font-sans mb-8">Summary</h3>
                
                {/* ITEMS LIST */}
                <div className="space-y-6 mb-8 max-h-100 overflow-y-auto pr-2 custom-scrollbar">
                  {bag.map((item: any) => {
                    const isPackage = item.category?.toLowerCase() === 'package';
                    return (
                      <div key={item.id} className="flex gap-4 items-start group border-b border-gray-100 pb-4 last:border-0">
                        <div className="relative w-14 h-14 shrink-0 bg-white shadow-sm overflow-hidden">
                          <Image src={item.image || "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=200"} alt={item.name} fill className="object-cover" />
                        </div>
                        <div className="grow">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <p className="text-xs font-bold text-black leading-tight uppercase font-sans tracking-wide">{item.name}</p>
                                
                                {/* 🟢 VISUAL BADGES FOR PROMO TYPE */}
                                {isPackage && (
                                  <span className="bg-[#D4AF37] text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                    Package
                                  </span>
                                )}
                            </div>
                            
                            <p className="text-[10px] text-gray-400 uppercase font-sans tracking-wide mb-1">
                                {item.category || 'Treatment'}
                            </p>

                            <p className="text-[11px] font-bold text-black font-sans">{item.price}</p>
                            <button onClick={() => removeFromBag?.(item.id)} className="text-[9px] text-red-400 hover:text-red-600 underline font-sans mt-2">Remove</button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 🟢 TOTALS SECTION */}
                <div className="border-t border-gray-200 pt-6 space-y-2">
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black font-sans">Total Est.</span>
                    <span className="text-xl font-bold font-playfair text-black">${finalTotal.toFixed(2)}</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-xl shadow-black/5 border border-gray-100 text-center py-24 px-6">
            <p className="text-gray-400 uppercase text-[10px] tracking-[0.2em] mb-8 font-medium font-sans">Your bag is currently empty</p>
            <Link href="/treatments" className="inline-block border border-black px-10 py-3 text-[10px] font-bold tracking-[0.2em] uppercase text-black hover:bg-black hover:text-white transition-all duration-300 font-sans">Browse Menu</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingPage;