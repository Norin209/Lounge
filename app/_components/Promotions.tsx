'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '../_utils/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useBag } from '../_context/BagContext'; 

interface PromoItem {
  id: string;
  name: string;
  price: string;
  promoPrice?: string;
  discountValue?: string;
  discountType?: 'percent' | 'fixed';
  image?: string;
  description?: string;
  category: string;
  duration?: string;
}

const Promotions = () => {
  const [promos, setPromos] = useState<PromoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePromo, setActivePromo] = useState<PromoItem | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3; 

  const { addToBag } = useBag();
  const defaultImage = "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1000";

  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const q = query(collection(db, "services"), where("isMonthlyPromo", "==", true));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as PromoItem));
        setPromos(data);
        if (data.length > 0) setActivePromo(data[0]);
      } catch (error) {
        console.error("Error fetching promos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPromos();
  }, []);

  // Helpers
  const getCalculatedPrice = (item: PromoItem) => {
    const originalPrice = parseFloat(item.price.replace(/[^0-9.]/g, ''));
    if (isNaN(originalPrice)) return item.price; 

    if (item.discountValue) {
      const val = parseFloat(item.discountValue);
      let final = originalPrice;
      if (item.discountType === 'percent') {
        final = originalPrice - (originalPrice * (val / 100));
      } else {
        final = originalPrice - val;
      }
      return '$' + final.toFixed(2);
    }
    return item.promoPrice || item.price;
  };

  const getDiscountLabel = (item: PromoItem) => {
    if (item.discountType === 'percent') return `-${item.discountValue}%`;
    return `SAVE $${item.discountValue}`;
  };

  const handleAddToBag = (item: PromoItem) => {
    addToBag({
      id: item.id,
      name: item.name,
      price: getCalculatedPrice(item),
      category: item.category,
      duration: item.duration || 'Special',
      image: item.image || defaultImage
    });
  };

  // Pagination Logic
  const totalPages = Math.ceil(promos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = promos.slice(startIndex, startIndex + itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  if (!loading && promos.length === 0) return null;

  const displayPromo = activePromo || promos[0];

  return (
    <section className="py-20 md:py-28 bg-[#FFFBF0] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* HEADER */}
        <div className="text-center mb-10 md:mb-16 space-y-3">
          <span className="text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase text-red-500">
            Limited Time Offers
          </span>
          <h2 className="text-3xl md:text-5xl font-playfair text-black">
            Monthly <span className="italic text-gray-500">Specials</span>
          </h2>
        </div>

        {/* 🟢 UNIFIED GRID (Mobile: Stacked | Desktop: Split) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-stretch min-h-125">
          
          {/* 1. VISUAL DISPLAY (Mobile: Top, Desktop: Left) */}
          <div className="md:col-span-7 relative group cursor-pointer w-full h-87.5` md:h-auto"
               onClick={() => displayPromo && handleAddToBag(displayPromo)}>
            
            {/* Desktop Border Effect */}
            <div className="absolute top-4 left-4 w-full h-full border border-black/10 z-0 hidden md:block transition-transform duration-500 group-hover:translate-x-2 group-hover:translate-y-2" />
            
            <div className="relative h-full w-full z-10 overflow-hidden bg-gray-200 shadow-md md:shadow-none">
              {displayPromo && (
                <>
                  <div className="absolute top-0 right-0 z-20 bg-red-600 text-white text-[10px] md:text-sm font-bold px-3 py-1.5 md:px-4 md:py-2 uppercase tracking-widest shadow-lg">
                    {displayPromo.discountValue ? getDiscountLabel(displayPromo) : 'Special'}
                  </div>

                  <Image
                    key={displayPromo.id} 
                    src={displayPromo.image || defaultImage}
                    alt={displayPromo.name}
                    fill
                    className="object-cover animate-fadeIn" 
                  />

                  {/* Text Overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6 md:p-12">
                    <p className="text-white/80 text-[10px] md:text-xs tracking-[0.2em] uppercase mb-1 md:mb-2">
                      {displayPromo.category}
                    </p>
                    <h3 className="text-white text-2xl md:text-4xl font-playfair mb-3 md:mb-4">
                      {displayPromo.name}
                    </h3>
                    <div className="flex items-center gap-4">
                      <span className="bg-white text-black px-4 py-2 md:px-6 md:py-3 text-[9px] md:text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-gray-200 transition-colors">
                        Add to Bag — {getCalculatedPrice(displayPromo)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 2. LIST (Mobile: Bottom, Desktop: Right) */}
          <div className="md:col-span-5 flex flex-col h-full justify-between">
            <div className="space-y-2">
              {currentItems.map((item) => {
                 const isActive = activePromo?.id === item.id;
                 return (
                  <div 
                    key={item.id} 
                    // 🟢 BOTH HOVER & CLICK update the image
                    onMouseEnter={() => setActivePromo(item)}
                    onClick={() => setActivePromo(item)}
                    className={`
                      group flex items-center justify-between p-4 md:p-6 border-b cursor-pointer transition-all duration-300
                      ${isActive ? 'bg-white shadow-lg border-transparent scale-[1.02] md:-ml-4 pl-6 md:pl-8 rounded-sm z-10' : 'border-gray-200 hover:bg-white/50'}
                    `}
                  >
                    <div>
                      <h4 className={`text-base md:text-lg font-playfair mb-1 transition-colors ${isActive ? 'text-red-600 font-bold' : 'text-black'}`}>
                        {item.name}
                      </h4>
                      <p className="text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500">
                        {item.duration || '60 Min'} • {item.category}
                      </p>
                    </div>
                    
                    <div className="text-right">
                       <span className="block text-[10px] md:text-xs text-gray-400 line-through">
                         {item.price}
                       </span>
                       <span className={`text-base md:text-lg font-playfair ${isActive ? 'text-black' : 'text-gray-600'}`}>
                         {getCalculatedPrice(item)}
                       </span>
                    </div>
                  </div>
                 );
              })}
            </div>

            {/* Pagination Controls */}
            <div className="pt-8 md:pt-12 flex items-center justify-between border-t border-gray-200/60 mt-4 md:mt-8">
                <div className="flex gap-4">
                  <button 
                    onClick={handlePrevPage} 
                    disabled={currentPage === 1}
                    className={`p-2 md:p-3 rounded-full border transition-all ${currentPage === 1 ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-black text-black hover:bg-black hover:text-white'}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                  </button>
                  <button 
                    onClick={handleNextPage} 
                    disabled={currentPage === totalPages}
                    className={`p-2 md:p-3 rounded-full border transition-all ${currentPage === totalPages ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-black text-black hover:bg-black hover:text-white'}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                  </button>
                </div>

                <div className="text-[9px] md:text-[10px] font-bold tracking-[0.2em] text-gray-400">
                  PAGE {currentPage} / {totalPages || 1}
                </div>

                <Link href="/treatments" className="text-[9px] md:text-[10px] font-bold tracking-[0.2em] uppercase border-b border-black pb-1 hover:text-gray-600 transition-colors">
                  View All
                </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Promotions;