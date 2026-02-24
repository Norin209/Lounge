'use client'; 

import { useState, useMemo, useRef, useEffect } from 'react'; 
import Image from 'next/image';
import Link from 'next/link'; 
import { useBag } from '../_context/BagContext'; 
import { db } from '../_utils/firebase'; 
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore'; 

const reliableImage = "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=600&auto=format&fit=crop";
const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=800&auto=format&fit=crop";

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
  order?: number; 
  isPaused?: boolean; // 🟢 Added isPaused
}

interface CategoryItem {
  id: string;
  label: string;
  image: string;
}

// 🟢 STATIC TABS (Deals stays pinned to the front)
const STATIC_TABS = [
  { 
    id: "PROMOTIONS", 
    label: "Deals", 
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600" 
  }
];

const TreatmentMenu = () => {
  const [activeTab, setActiveTab] = useState("PROMOTIONS");
  const [services, setServices] = useState<TreatmentItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>(STATIC_TABS);
  const [loading, setLoading] = useState(true);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tabContainerRef = useRef<HTMLDivElement>(null); 
  
  // Safe optional chaining for BagContext
  const bagContext = useBag();
  const addToBag = bagContext?.addToBag || (() => {});
  const bag = bagContext?.bag || [];

  // 🟢 REAL-TIME DATA FETCHING & SORTING
  useEffect(() => {
    // 1. Fetch Dynamic Categories from Admin
    const fetchCategories = async () => {
      try {
        const catDoc = await getDoc(doc(db, "settings", "service_categories"));
        if (catDoc.exists()) {
          const fetchedCats = catDoc.data().list || [];
          const dynamicCats = fetchedCats.map((c: any) => ({
            id: c.id,
            label: c.label,
            image: c.image || PLACEHOLDER_IMG 
          }));
          setCategories([...STATIC_TABS, ...dynamicCats]);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();

    // 2. Listen to Services in Real-Time
    const unsubscribe = onSnapshot(collection(db, "services"), (snapshot) => {
      const rawData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TreatmentItem));

      // 🟢 Filter out paused items
      const activeServices = rawData.filter(item => !item.isPaused);

      // 🟢 SORT BY ORDER
      activeServices.sort((a, b) => {
        const orderA = a.order !== undefined && a.order !== null ? Number(a.order) : 999;
        const orderB = b.order !== undefined && b.order !== null ? Number(b.order) : 999;
        return orderA - orderB;
      });

      setServices(activeServices);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to menu:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      const matchingCat = categories.find(c => c.id.toLowerCase().includes(hash) || hash.includes(c.id.split(' ')[0].toLowerCase()));
      if (matchingCat) setActiveTab(matchingCat.id);
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [categories]);

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
      const amount = 200;
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
  
  // 🟢 DYNAMIC FILTERING
  const filteredItems = useMemo(() => {
    return services.filter(item => {
      if (activeTab === "PROMOTIONS") return item.isMonthlyPromo === true;
      return item.category === activeTab;
    });
  }, [activeTab, services]);

  if (loading) {
    return <div className="py-20 text-center text-xs uppercase tracking-widest text-gray-400">Loading Menu...</div>;
  }

  return (
    <section id="full-menu" className="py-0 bg-white text-black">
      
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-4 text-center">
        <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400 mb-4">Our Full Menu</h3>
        <div className="w-10 h-px bg-gray-300 mx-auto" />
      </div>

      {/* 🟢 TABS */}
      <nav className="relative z-10 bg-white border-b border-gray-100 shadow-sm">
        <div className="relative max-w-7xl mx-auto px-4 py-2 group">
          
          <button 
            onClick={() => scrollTabs('left')} 
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-gray-100 w-10 h-10 rounded-full shadow-md flex items-center justify-center text-black ml-2 transition-colors cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>

          <div 
            ref={tabContainerRef} 
            className="flex overflow-x-auto justify-start gap-4 hide-scrollbar px-2 py-8 scroll-smooth snap-x"
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`
                  relative shrink-0 z-0
                  w-24 h-24 md:w-28 md:h-28
                  rounded-xl overflow-hidden transition-all duration-300 snap-start transform-gpu
                  ${activeTab === cat.id 
                    ? "border-[3px] border-black scale-110 shadow-xl z-10" 
                    : "border border-transparent hover:scale-105 hover:shadow-md opacity-90 hover:opacity-100"
                  }
                `}
                style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}
              >
                <Image 
                  src={cat.image} 
                  alt={cat.label} 
                  fill 
                  className="object-cover" 
                  sizes="(max-width: 768px) 100px, 120px"
                />
                
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-80" />

                <div className="absolute bottom-2 left-0 right-0 text-center px-1">
                  <span className={`
                    text-[9px] md:text-[10px] font-bold tracking-widest uppercase text-white drop-shadow-md
                    ${activeTab === cat.id ? "opacity-100" : "opacity-90"}
                  `}>
                    {cat.label}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <button 
            onClick={() => scrollTabs('right')} 
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-gray-100 w-10 h-10 rounded-full shadow-md flex items-center justify-center text-black mr-2 transition-colors cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      </nav>

      {/* 🟢 SERVICES CAROUSEL */}
      <div className="max-w-7xl mx-auto px-6 py-12 relative">
          <button onClick={() => scrollServices('left')} className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-md rounded-full items-center justify-center hover:scale-110 transition-transform text-black border border-gray-100 cursor-pointer">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>

          <div ref={scrollContainerRef} className="flex flex-nowrap overflow-x-auto gap-6 pb-4 hide-scrollbar snap-x snap-mandatory scroll-smooth">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => {
                const isInBag = bag.some(b => b.id === item.id);
                const hasPromo = item.isMonthlyPromo && item.discountValue;
                const finalPrice = getCalculatedPrice(item);
                const displayImage = item.image || reliableImage;

                return (
                  <div key={item.id} className="group shrink-0 w-72 snap-start flex flex-col h-full">
                    <div className="relative aspect-4/5 overflow-hidden mb-4 bg-gray-50 shadow-sm shrink-0">
                      
                      {hasPromo && (
                        <div className="absolute top-2 right-2 z-10 bg-[#D4AF37] text-white text-[9px] font-bold px-2 py-1 uppercase tracking-widest shadow-sm">
                          {item.discountType === 'percent' ? `${item.discountValue}% OFF` : `SAVE $${item.discountValue}`}
                        </div>
                      )}

                      <Image src={displayImage} alt={item.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                      
                      <div className="absolute inset-0 bg-black/10 xl:bg-black/20 opacity-100 xl:opacity-0 xl:group-hover:opacity-100 transition-opacity duration-300 flex items-end pb-4 justify-center px-4">
                        {isInBag ? (
                          <Link href="/book" className="w-full bg-black text-white py-3 text-[10px] font-bold tracking-[0.2em] uppercase shadow-lg text-center">
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
                            className="w-full bg-white text-black py-3 text-[10px] font-bold tracking-[0.2em] uppercase shadow-lg hover:bg-gray-100"
                          >
                            Add to Bag
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 flex flex-col grow">
                      <div className="flex justify-between items-start">
                         <h4 className="text-sm text-gray-900 font-medium tracking-wide">{item.name}</h4>
                         
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
                          {item.duration || '60 min'} • {categories.find(c => c.id === item.category)?.label || item.category}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="w-full text-center text-gray-400 py-20 italic">
                {activeTab === "PROMOTIONS" ? "No special promotions available." : `No treatments found.`}
              </div>
            )}
          </div>
          
          <button onClick={() => scrollServices('right')} className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-md rounded-full items-center justify-center hover:scale-110 transition-transform text-black border border-gray-100 cursor-pointer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
      </div>

      <div className="mt-8 pb-20 text-center">
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