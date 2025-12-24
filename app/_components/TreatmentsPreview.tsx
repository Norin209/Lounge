'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '../_utils/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useBag } from '../_context/BagContext';

interface TreatmentItem {
  id: string;
  name: string;
  description?: string;
  image?: string;
  price: string;
  category: string;
  duration?: string;
}

const TreatmentsPreview = () => {
  const [signatures, setSignatures] = useState<TreatmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const { addToBag, bag } = useBag();
  
  const defaultImage = "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=800";

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

  const handleAddToBag = (item: TreatmentItem) => {
    addToBag({
      id: item.id,
      name: item.name,
      price: item.price,
      category: item.category,
      duration: item.duration || 'N/A',
      image: item.image || defaultImage
    });
  };

  if (loading) return null; 

  return (
    // 🟢 UPDATED: Changed bg-zinc-100 to bg-white
    <section className="py-20 bg-white text-center">
      <div className="max-w-2xl mx-auto mb-12 px-6">
        <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400 mb-4">Our Menu</h3>
        <h2 className="text-3xl md:text-4xl font-playfair text-black mb-6">Signature Therapies</h2>
        <div className="w-16 h-px bg-gray-300 mx-auto" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative">
        {/* Mobile Arrows */}
        <button onClick={() => scroll('left')} className="md:hidden absolute left-0 top-1/2 -translate-y-1/2 z-10 text-gray-800/80 hover:text-black p-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <button onClick={() => scroll('right')} className="md:hidden absolute right-0 top-1/2 -translate-y-1/2 z-10 text-gray-800/80 hover:text-black p-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>

        {/* 🟢 UPDATED: Removed md:justify-center to align items to the start */}
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory gap-6 pb-4"
        >
          {signatures.length > 0 ? (
            signatures.map((item) => {
              const isInBag = bag.some(b => b.id === item.id);

              return (
                <div 
                  key={item.id} 
                  className="group shrink-0 w-72 snap-start flex flex-col h-full"
                >
                  <div className="relative aspect-square overflow-hidden mb-4 bg-white shadow-sm shrink-0">
                    <Image 
                      src={item.image || defaultImage} 
                      alt={item.name} 
                      fill 
                      className="object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    
                    {/* Desktop Hover Button */}
                    <div className="hidden md:flex absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-end pb-4 justify-center px-4">
                      {isInBag ? (
                         <Link href="/book" className="w-full bg-white text-black py-2 text-[10px] font-bold tracking-[0.2em] uppercase shadow-lg text-center">
                           View Bag
                         </Link>
                      ) : (
                        <button 
                          onClick={() => handleAddToBag(item)}
                          className="w-full bg-white text-black py-2 text-[10px] font-bold tracking-[0.2em] uppercase shadow-lg"
                        >
                          Add to Bag
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 flex flex-col grow text-left">
                    <div className="flex justify-between items-start">
                       <h4 className="text-sm text-gray-900 font-medium tracking-wide">{item.name}</h4>
                       {/* Price */}
                       <span className="text-xs text-gray-900 font-bold ml-2 whitespace-nowrap">{item.price}</span>
                    </div>
                    
                    <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">
                      {item.description || "A luxurious treatment designed to restore balance and harmony to your body."}
                    </p>

                    {/* Mobile Button */}
                    <div className="md:hidden mt-auto pt-3">
                       <button 
                         onClick={() => isInBag ? null : handleAddToBag(item)}
                         className={`w-full py-2 text-[10px] font-bold tracking-[0.2em] uppercase transition-colors shadow-sm ${
                           isInBag 
                           ? "bg-gray-100 text-gray-400 cursor-default" 
                           : "bg-black text-white hover:bg-gray-800"
                         }`}
                       >
                         {isInBag ? "In Bag" : "Add to Bag"}
                       </button>
                    </div>
                    
                  </div>
                </div>
              );
            })
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