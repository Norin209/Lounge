'use client'; 

import { useState, useMemo, useRef, useEffect } from 'react'; 
import Image from 'next/image';
import Link from 'next/link'; 
import { useBag } from '../_context/BagContext'; 
import { db } from '../_utils/firebase'; 
import { collection, getDocs } from 'firebase/firestore'; 

const reliableImage = "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=600&auto=format&fit=crop";

interface TreatmentItem {
  id: string; 
  name: string;
  category: string; 
  price: string;
  duration?: string;
  description?: string;
  image?: string;
  promoPrice?: string;      
  isMonthlyPromo?: boolean; 
  discountValue?: string;
  discountType?: 'percent' | 'fixed';
}

const tabs = ["PROMOTIONS", "NAILS & LASHES", "HAIR", "FACIALS", "BODY & WAX", "PACKAGES"];

const TreatmentMenu = () => {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [services, setServices] = useState<TreatmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tabContainerRef = useRef<HTMLDivElement>(null); 
  const { addToBag, bag } = useBag();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "services"));
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as TreatmentItem));
        setServices(data);
      } catch (error) {
        console.error("Error fetching menu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  const getCalculatedPrice = (item: TreatmentItem) => {
    const originalPrice = parseFloat(item.price.replace(/[^0-9.]/g, ''));
    if (isNaN(originalPrice)) return item.price; 

    if (item.isMonthlyPromo && item.discountValue) {
      const discountVal = parseFloat(item.discountValue);
      let finalPrice = originalPrice;
      if (item.discountType === 'percent') {
        finalPrice = originalPrice - (originalPrice * (discountVal / 100));
      } else {
        finalPrice = originalPrice - discountVal;
      }
      return '$' + finalPrice.toFixed(2);
    }
    return item.promoPrice || item.price;
  };

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabContainerRef.current) {
      const amount = 150;
      const current = tabContainerRef.current.scrollLeft;
      tabContainerRef.current.scrollTo({
        left: direction === 'left' ? current - amount : current + amount,
        behavior: 'smooth'
      });
    }
  };

  const scrollServices = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
        const amount = 300; 
        const current = scrollContainerRef.current.scrollLeft;
        scrollContainerRef.current.scrollTo({
            left: direction === 'left' ? current - amount : current + amount,
            behavior: 'smooth',
        });
    }
  };
  
  const filteredItems = useMemo(() => {
    return services.filter(item => {
      const cat = item.category?.toLowerCase() || "";
      switch (activeTab) {
        case "PROMOTIONS": return item.isMonthlyPromo === true;
        case "NAILS & LASHES": return cat.includes('nail') || cat.includes('lash');
        case "HAIR": return cat.includes('hair');
        case "FACIALS": return cat.includes('facial') || cat.includes('face');
        case "BODY & WAX": return cat.includes('body') || cat.includes('wax') || cat.includes('massage') || cat.includes('scrub');
        case "PACKAGES": return cat.includes('package');
        default: return false;
      }
    });
  }, [activeTab, services]);

  if (loading) {
    return <div className="py-20 text-center text-xs uppercase tracking-widest text-gray-400">Loading Menu...</div>;
  }

  return (
    <section className="py-0 bg-zinc-100 text-black">
      
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-10 text-center">
        <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-500 mb-4">Our Full Menu</h3>
        <div className="w-10 h-px bg-gray-400 mx-auto" />
      </div>

      {/* Sticky Tabs Wrapper */}
      {/* 🔴 FIXED: Changed z-30 to z-1 to prevent mobile menu overlap */}
      <div className="sticky top-0 z-1 bg-zinc-100 border-b border-gray-300 shadow-sm">
        <div className="relative max-w-7xl mx-auto px-6 py-4 group">
          
          <button 
            onClick={() => scrollTabs('left')}
            className="md:hidden absolute left-0 top-0 bottom-0 z-20 bg-linear-to-r from-zinc-100 via-zinc-100 to-transparent w-12 flex items-center justify-start pl-4 text-black hover:text-gray-600"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>

          <div 
            ref={tabContainerRef}
            className="flex overflow-x-auto justify-start md:justify-center gap-6 hide-scrollbar px-2 md:px-0 scroll-smooth"
          > 
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap text-[10px] md:text-[11px] font-bold tracking-[0.15em] uppercase transition-all duration-300 border-b-2 pb-2 shrink-0
                  ${activeTab === tab ? "text-black border-black" : "text-gray-400 border-transparent hover:text-black"}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button 
            onClick={() => scrollTabs('right')}
            className="md:hidden absolute right-0 top-0 bottom-0 z-20 bg-linear-to-l from-zinc-100 via-zinc-100 to-transparent w-12 flex items-center justify-end pr-4 text-black hover:text-gray-600"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 relative">
          <button onClick={() => scrollServices('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 text-gray-800/80 hover:text-black transition-colors">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>

          <div ref={scrollContainerRef} className="flex flex-nowrap overflow-x-auto gap-6 pb-4 hide-scrollbar snap-x snap-mandatory">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => {
                const isInBag = bag.some(b => b.id === item.id);
                const hasPromo = item.isMonthlyPromo && item.discountValue;
                const finalPrice = getCalculatedPrice(item);
                const displayImage = item.image || reliableImage;

                return (
                  <div key={item.id} className="group shrink-0 w-72 snap-start flex flex-col h-full">
                    <div className="relative aspect-square overflow-hidden mb-4 bg-white shadow-sm shrink-0">
                      
                      {/* PROMO BADGE */}
                      {hasPromo && (
                        <div className="absolute top-2 right-2 z-10 bg-[#D4AF37] text-white text-[9px] font-bold px-2 py-1 uppercase tracking-widest shadow-sm">
                          {item.discountType === 'percent' ? `${item.discountValue}% OFF` : `SAVE $${item.discountValue}`}
                        </div>
                      )}

                      <Image src={displayImage} alt={item.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                      
                      <div className="absolute inset-0 bg-black/10 md:bg-black/20 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex items-end pb-4 justify-center px-4">
                        {isInBag ? (
                          <Link href="/book" className="w-full bg-black text-white py-2 text-[10px] font-bold tracking-[0.2em] uppercase shadow-lg text-center">
                            View Bag
                          </Link>
                        ) : (
                          <button 
                            onClick={() => addToBag({
                              id: item.id,
                              name: item.name,
                              price: finalPrice, 
                              category: item.category,
                              duration: item.duration || '60 min',
                              image: displayImage
                            })}
                            className="w-full bg-white text-black py-2 text-[10px] font-bold tracking-[0.2em] uppercase shadow-lg"
                          >
                            Add to Bag
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 flex flex-col grow">
                      <div className="flex justify-between items-start">
                         <h4 className="text-sm text-gray-900 font-medium tracking-wide">{item.name}</h4>
                         
                         {/* PRICE DISPLAY */}
                         <div className="text-right whitespace-nowrap ml-2">
                             {hasPromo ? (
                               <>
                                 <span className="block text-[10px] text-gray-400 line-through">{item.price}</span>
                                 <span className="text-xs font-bold text-[#D4AF37]">{finalPrice}</span>
                               </>
                             ) : (
                               <span className="text-xs text-gray-900 font-bold">{item.price}</span>
                             )}
                         </div>
                      </div>
                      
                      {item.description && (
                        <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed h-[3em]">
                          {item.description}
                        </p>
                      )}

                      <div className="pt-1 mt-auto">
                        <p className="text-[10px] text-gray-400 font-light uppercase tracking-widest">
                          {item.duration || '60 min'} • {item.category}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="w-full text-center text-gray-400 py-20 italic">
                {activeTab === "PROMOTIONS" ? "No special promotions available." : `No treatments found for ${activeTab.toLowerCase()}.`}
              </div>
            )}
          </div>
          
          <button onClick={() => scrollServices('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 text-gray-800/80 hover:text-black transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
      </div>

      <div className="mt-16 pb-20 text-center">
        <Link 
          href="/treatments" 
          className="inline-block border border-black px-10 py-3 text-xs font-bold tracking-[0.2em] uppercase text-black hover:bg-black hover:text-white transition-colors"
        >
          View Full Menu
        </Link>
      </div>
    </section>
  );
};

export default TreatmentMenu;