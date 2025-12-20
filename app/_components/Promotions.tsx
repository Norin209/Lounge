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
  const { addToBag } = useBag();

  // 1. FETCH ONLY ACTIVE PROMOS
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
      } catch (error) {
        console.error("Error fetching promos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPromos();
  }, []);

  // 2. HELPER: CALCULATE PRICE
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

  // If no promos are active, return null (hide section)
  if (!loading && promos.length === 0) return null;

  const featuredPromo = promos[0];
  const defaultImage = "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1000";

  // ✅ HELPER: Add to bag safely (Fixes the crash)
  const handleAddToBag = (item: PromoItem) => {
    addToBag({
      id: item.id,
      name: item.name,
      price: getCalculatedPrice(item),
      category: item.category,
      // Fixes the error by providing defaults:
      duration: item.duration || 'Special',
      image: item.image || defaultImage
    });
  };

  return (
    <section className="py-16 md:py-24 bg-[#FFFBF0]">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
        
        {/* LEFT: Featured Deal Image */}
        <div className="relative h-100 md:h-150 w-full order-2 md:order-1 group cursor-pointer" 
             onClick={() => featuredPromo && handleAddToBag(featuredPromo)}>
          
          <div className="absolute top-4 left-4 w-full h-full border border-yellow-200 z-0 hidden md:block" />
          
          <div className="relative h-full w-full z-10 overflow-hidden">
            {featuredPromo && (
              <div className="absolute top-4 left-0 z-20 bg-red-600 text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest">
                Best Deal
              </div>
            )}
            <Image
              src={featuredPromo?.image || defaultImage}
              alt="Promotion"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="bg-white text-black px-6 py-3 text-[10px] uppercase font-bold tracking-widest">
                Quick Add +
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: List of Specials */}
        <div className="space-y-8 order-1 md:order-2">
          <div>
            <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-red-500 mb-2">
              Limited Time Offers
            </h3>
            <h2 className="text-3xl md:text-5xl font-playfair text-black leading-tight">
              Monthly <br/> Specials
            </h2>
          </div>

          <div className="space-y-6">
            {loading ? (
              <p className="text-sm text-gray-400">Loading offers...</p>
            ) : (
              promos.slice(0, 3).map((item) => (
                <div key={item.id} className="flex justify-between items-center border-b border-gray-200 pb-4 group">
                  <div>
                    <h4 className="font-bold text-lg font-playfair text-black group-hover:text-yellow-600 transition-colors">
                      {item.name}
                    </h4>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">
                      {item.duration || 'Special Treatment'}
                    </p>
                  </div>
                  <div className="text-right">
                     <span className="block text-xs text-gray-400 line-through decoration-gray-400">
                       {item.price}
                     </span>
                     <span className="text-xl font-bold text-red-600 font-playfair">
                       {getCalculatedPrice(item)}
                     </span>
                     <button 
                       onClick={() => handleAddToBag(item)}
                       className="block ml-auto mt-1 text-[9px] font-bold uppercase underline hover:text-red-600"
                     >
                       Add to Bag
                     </button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="pt-4">
            <Link href="/treatments" className="inline-block bg-black text-white px-8 py-3 text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-zinc-800 transition-all">
              View All Promotions
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Promotions;