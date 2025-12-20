'use client';
import { useRef } from 'react';

const reviews = [
  { id: 1, name: "Sarah Jenkins", text: "The best massage I have ever had. The atmosphere is like stepping into another world.", date: "Jan 2025" },
  { id: 2, name: "Michael Chen", text: "Incredible attention to detail with the nail art. My go-to spot in the city now.", date: "Dec 2024" },
  { id: 3, name: "Emma Wilson", text: "The facial treatments left my skin glowing for weeks. Truly a premium experience.", date: "Feb 2025" }
];

const Testimonials = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section className="py-24 bg-gray-50 border-t border-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <h3 className="text-center text-[10px] font-bold tracking-[0.3em] uppercase text-gray-400 mb-16">Guest Experiences</h3>
        
        <div 
          ref={scrollRef}
          className="flex gap-8 overflow-x-auto hide-scrollbar snap-x snap-mandatory px-4"
        >
          {reviews.map((rev) => (
            <div key={rev.id} className="min-w-[90%] md:min-w-100 snap-center bg-white p-12 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                <span className="text-4xl text-gray-200 font-serif block mb-6">“</span>
                <p className="text-lg md:text-xl font-playfair italic text-black leading-relaxed mb-8">
                  {rev.text}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold tracking-widest uppercase text-black">{rev.name}</p>
                <div className="flex gap-1 text-black text-[10px] mt-2">★★★★★</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;