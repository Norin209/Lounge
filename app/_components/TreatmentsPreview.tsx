'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '../_utils/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

interface TreatmentItem {
  id: string;
  name: string;
  description?: string;
  image?: string;
  price: string;
  category: string;
}

const TreatmentsPreview = () => {
  const [signatures, setSignatures] = useState<TreatmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const defaultImage = "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=800";

  // 1. FETCH ONLY SIGNATURE ITEMS
  useEffect(() => {
    const fetchSignatures = async () => {
      try {
        const q = query(collection(db, "services"), where("isSignature", "==", true));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as TreatmentItem));
        setSignatures(data);
      } catch (error) {
        console.error("Error fetching signatures:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSignatures();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      const currentScroll = scrollContainerRef.current.scrollLeft;
      scrollContainerRef.current.scrollTo({
        left: direction === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (loading) return null; 

  return (
    <section className="py-20 bg-gray-50 text-center">
      <div className="max-w-2xl mx-auto mb-16 px-6">
        <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400 mb-4">Our Menu</h3>
        <h2 className="text-3xl md:text-4xl font-playfair text-black mb-6">Signature Therapies</h2>
        <div className="w-16 h-px bg-gray-300 mx-auto" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative">
        {/* Mobile Arrows */}
        <button onClick={() => scroll('left')} className="md:hidden absolute left-2 top-1/3 z-10 text-black/50 bg-white p-2 rounded-full shadow-md">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <button onClick={() => scroll('right')} className="md:hidden absolute right-2 top-1/3 z-10 text-black/50 bg-white p-2 rounded-full shadow-md">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>

        {/* Scroll Container */}
        <div 
          ref={scrollContainerRef}
          className="flex md:grid md:grid-cols-3 gap-8 overflow-x-auto hide-scrollbar snap-x snap-mandatory"
        >
          {signatures.length > 0 ? (
            signatures.map((item) => (
              <div 
                key={item.id} 
                className="min-w-[85%] md:min-w-0 snap-center group relative bg-white shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
              >
                <div className="relative h-80 overflow-hidden bg-gray-100">
                  <Image 
                    src={item.image || defaultImage} 
                    alt={item.name} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                  <div className="absolute bottom-4 right-4 bg-white/95 px-4 py-2 text-xs font-bold tracking-widest uppercase shadow-sm text-black">
                    {item.price}
                  </div>
                </div>
                <div className="p-8 text-left">
                  <h3 className="text-xl font-playfair mb-3 text-black group-hover:text-gray-600 transition-colors">{item.name}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">
                    {item.description || "A luxurious treatment designed to restore balance and harmony to your body."}
                  </p>
                  
                  {/* 🗑️ REMOVED "VIEW DETAILS" LINK HERE */}
                  
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 py-10 text-gray-400 italic">
              Go to Admin Panel &gt; Services and click "◆ Sign" to feature items here.
            </div>
          )}
        </div>
      </div>

      <div className="mt-16">
        <Link href="/treatments" className="inline-block border border-black px-10 py-3 text-xs font-bold tracking-[0.2em] uppercase text-black hover:bg-black hover:text-white transition-colors">
          View Full Menu
        </Link>
      </div>
    </section>
  );
};

export default TreatmentsPreview;