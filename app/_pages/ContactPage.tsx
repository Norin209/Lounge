'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

const ContactPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: ''
  });

  useEffect(() => {
    if (isSuccess) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isSuccess]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const telegramMessage = `
📩 *NEW CONTACT INQUIRY* 📩
🏢 *Business:* Premier Lounge
👤 *Name:* ${formData.name}
📧 *Email:* ${formData.email}
📞 *Phone:* ${formData.phone}
🏷️ *Subject:* ${formData.subject}
📝 *Message:* ${formData.message}
    `;

    try {
      const response = await fetch('/.netlify/functions/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: telegramMessage })
      });

      if (response.ok) {
        setIsSuccess(true);
      } else {
        alert('Status 404: Please ensure you are running "netlify dev" locally.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error. Check your terminal logs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-zinc-50 min-h-screen font-sans">
        <div ref={topRef} />
        <div className="bg-black pt-32 pb-32 px-6 text-center">
          <h1 className="text-3xl md:text-5xl font-playfair text-white uppercase tracking-tight">Message Sent</h1>
        </div>
        <div className="max-w-md mx-auto px-6 -mt-20 relative z-10 mb-20">
          <div className="bg-white p-10 shadow-xl border border-gray-100 text-center">
            <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-playfair text-black mb-4 uppercase tracking-tight font-bold">Thank You</h2>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed font-sans">
              Your inquiry has been sent to the Premier Lounge concierge. We will contact you at <strong>{formData.phone}</strong> or via email shortly.
            </p>
            <Link href="/" className="block w-full bg-black text-white py-4 text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-zinc-800 transition-colors appearance-none rounded-none text-center">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-50 min-h-screen pb-24 font-sans text-left">
      <div ref={topRef} />
      
      <div className="bg-black pt-32 pb-48 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-500 mb-4 font-sans">Premier Lounge</h3>
          <h1 className="text-3xl md:text-5xl font-playfair text-white uppercase tracking-tight">Contact Us</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 -mt-32 relative z-10">
        <div className="bg-white shadow-xl border border-gray-100 flex flex-col lg:flex-row overflow-hidden">
          
          <div className="p-8 md:p-12 w-full lg:w-3/5 border-r border-gray-100 text-left">
            <h3 className="text-xl font-playfair font-bold text-black mb-8">Send a Message</h3>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-sans block">Name</label>
                  <input required name="name" type="text" value={formData.name} onChange={handleChange} placeholder="Full Name" className="w-full border-b border-gray-200 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-transparent font-sans appearance-none rounded-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-sans block">Email</label>
                  <input required name="email" type="email" value={formData.email} onChange={handleChange} placeholder="lepremierlounge@gmail.com" className="w-full border-b border-gray-200 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-transparent font-sans appearance-none rounded-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-sans block">Phone</label>
                  <input required name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="012 216 068" className="w-full border-b border-gray-200 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-transparent font-sans appearance-none rounded-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-sans block">Subject</label>
                  <div className="relative">
                    <select name="subject" value={formData.subject} onChange={handleChange} className="w-full border-b border-gray-200 py-3 text-sm focus:outline-none focus:border-black bg-transparent font-sans text-gray-600 appearance-none rounded-none pr-8">
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Booking Help">Booking Assistance</option>
                      <option value="Feedback">Feedback</option>
                    </select>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="text-gray-400"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-sans block">Message</label>
                <textarea required name="message" value={formData.message} onChange={handleChange} placeholder="How can our concierge assist you?" className="w-full border-b border-gray-200 py-3 text-sm focus:outline-none focus:border-black bg-transparent h-32 resize-none font-sans appearance-none rounded-none" />
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full bg-black text-white py-4 text-[10px] font-bold tracking-[0.25em] uppercase hover:bg-zinc-800 disabled:opacity-50 transition-all font-sans appearance-none rounded-none">
                {isSubmitting ? 'Sending Request...' : 'Send Message'}
              </button>
            </form>
          </div>

          <div className="w-full lg:w-2/5 bg-zinc-50 p-8 md:p-12 space-y-12 text-left">
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 font-sans">Location</h4>
              <p className="text-sm text-black leading-relaxed font-sans">
                Premier Lounge<br />
                HV8C+9C8, Phnom Penh Hanoi Friendship Blvd (1019)
              </p>
            </div>
            
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 font-sans">Connect</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-black font-sans">+855 12 216 068</p>
                  <p className="text-sm text-black font-sans">lepremierlounge@gmail.com</p>
                </div>
                
                {/* Social Buttons Grid */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <a href="https://t.me/premierlounge1" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full border border-black text-black py-3 text-[9px] font-bold tracking-[0.15em] uppercase hover:bg-black hover:text-white transition-all font-sans appearance-none rounded-none">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.16l-1.9 8.97c-.14.62-.51.77-1.03.48l-2.85-2.1-1.38 1.33c-.15.15-.28.28-.57.28l.2-2.9 5.28-4.77c.23-.21-.05-.33-.36-.12l-6.52 4.1-2.82-.88c-.61-.19-.62-.61.13-.9l11.05-4.26c.51-.19.96.11.77.87z"/>
                    </svg>
                    Telegram
                  </a>

                  <a href="https://www.facebook.com/share/1CxvAHfCjg/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full border border-black text-black py-3 text-[9px] font-bold tracking-[0.15em] uppercase hover:bg-black hover:text-white transition-all font-sans appearance-none rounded-none">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.893 1.456 5.467 3.735 7.155V22l3.411-1.875c.91.254 1.867.391 2.854.391 5.523 0 10-4.145 10-9.258S17.523 2 12 2zm1.18 10.963l-2.585-2.76-5.045 2.76 5.52-5.86 2.613 2.76 4.978-2.76-5.48 5.86z"/>
                    </svg>
                    Messenger
                  </a>

                  <a href="https://www.instagram.com/premierlounge_1/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full border border-black text-black py-3 text-[9px] font-bold tracking-[0.15em] uppercase hover:bg-black hover:text-white transition-all font-sans appearance-none rounded-none">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                    </svg>
                    Instagram
                  </a>

                  <a href="https://www.tiktok.com/@premier.lounge6?_r=1&_t=ZS-94ITV9NJ2P4" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full border border-black text-black py-3 text-[9px] font-bold tracking-[0.15em] uppercase hover:bg-black hover:text-white transition-all font-sans appearance-none rounded-none">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.04-.1z"/>
                    </svg>
                    TikTok
                  </a>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 font-sans">Hours</h4>
              <div className="space-y-2 text-sm text-black font-sans">
                <div className="flex justify-between">
                  <span>Daily</span>
                  <span>07:00 – 21:00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;