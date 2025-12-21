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
              Your inquiry has been sent to our concierge. We will contact you at <strong>{formData.phone}</strong> or via email shortly.
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
          <h3 className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-500 mb-4 font-sans">Concierge</h3>
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
                  <input required name="email" type="email" value={formData.email} onChange={handleChange} placeholder="email@example.com" className="w-full border-b border-gray-200 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-transparent font-sans appearance-none rounded-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-sans block">Phone</label>
                  <input required name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="089 698 788" className="w-full border-b border-gray-200 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-transparent font-sans appearance-none rounded-none" />
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
                <textarea required name="message" value={formData.message} onChange={handleChange} placeholder="How can we assist you?" className="w-full border-b border-gray-200 py-3 text-sm focus:outline-none focus:border-black bg-transparent h-32 resize-none font-sans appearance-none rounded-none" />
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
                Glisten Lounge Carwash Cafe Spa<br />
                HV8C+9C8, Phnom Penh Hanoi Friendship Blvd (1019)
              </p>
            </div>
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 font-sans">Connect</h4>
              <div className="space-y-2">
                <p className="text-sm text-black font-sans">+855 89 698 788</p>
                <p className="text-sm text-black font-sans">hello@glistenlounge.com</p>
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