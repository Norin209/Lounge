'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useBag } from '../_context/BagContext'; 
import { db } from '../_utils/firebase';
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore'; 

const HERO_IMAGE = "https://images.unsplash.com/photo-1600334129128-685c5582fd35?q=80&w=2000&auto=format&fit=crop";
const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=800&auto=format&fit=crop";

// 1. STATIC TABS (Virtual Categories)
const STATIC_TABS = [
  { 
    id: "PROMOTIONS", 
    label: "Promotion", 
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600" 
  },
  { 
    id: "SIGNATURE", 
    label: "Signature", 
    image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=600" 
  }
];

interface ServiceItem {
  id: string;
  name: string;
  category: string;
  price: string;
  promoPrice?: string;      
  isMonthlyPromo?: boolean; 
  discountValue?: string;
  discountType?: 'percent' | 'fixed';
  description?: string;
  image?: string;
  duration?: string;
  isSignature?: boolean;
  order?: number; 
  isPaused?: boolean;
}

interface CategoryItem {
  id: string;
  label: string;
  image: string;
}

const TreatmentsPage = () => {
  const [activeTab, setActiveTab] = useState("PROMOTIONS");
  const [services, setServices] = useState<ServiceItem[]>([]); 
  const [categories, setCategories] = useState<CategoryItem[]>(STATIC_TABS); 
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'carousel'>('list');
  const [showScrollTop, setShowScrollTop] = useState(false);

  const tabContainerRef = useRef<HTMLDivElement>(null); 
  const scrollContainerRef = useRef<HTMLDivElement>(null); 
  
  const bagContext = useBag();
  const addToBag = bagContext?.addToBag || (() => {});
  const bag = bagContext?.bag || [];

  // 2. REAL-TIME DATA FETCHING
  useEffect(() => {
    // A. Fetch Categories
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

    // B. Real-time Listener for Services
    const unsubscribe = onSnapshot(collection(db, "services"), (snapshot) => {
      const rawData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ServiceItem));

      const activeServices = rawData.filter(item => !item.isPaused);

      activeServices.sort((a, b) => {
        const orderA = a.order !== undefined && a.order !== null ? Number(a.order) : 999;
        const orderB = b.order !== undefined && b.order !== null ? Number(b.order) : 999;
        return orderA - orderB;
      });

      setServices(activeServices);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to services:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (viewMode === 'carousel' && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [activeTab, viewMode]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

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

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const amount = 300;
      const current = scrollContainerRef.current.scrollLeft;
      scrollContainerRef.current.scrollTo({
        left: direction === 'left' ? current - amount : current + amount,
        behavior: 'smooth'
      });
    }
  };

  const getCalculatedPrice = (item: ServiceItem) => {
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

  const filteredItems = useMemo(() => {
    return services.filter(item => {
      if (activeTab === "PROMOTIONS") return item.isMonthlyPromo === true;
      if (activeTab === "SIGNATURE") return item.isSignature === true;
      return item.category === activeTab;
    });
  }, [activeTab, services]);

  const handleAddToBag = (item: ServiceItem) => {
    addToBag({
      id: item.id,
      name: item.name,
      price: getCalculatedPrice(item),
      category: item.category,
      duration: item.duration || 'N/A', 
      image: item.image || PLACEHOLDER_IMG 
    });
  };

  if (loading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400">Loading Menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-24 relative">
      
      {/* HERO SECTION */}
      <section className="relative h-[45vh] md:h-[50vh] w-full flex items-center justify-center overflow-hidden">
        <Image src={HERO_IMAGE} alt="Header" fill priority className="object-cover brightness-[0.4]" />
        <div className="relative z-0 text-center px-6">
          <h1 className="text-3xl md:text-5xl font-playfair text-white mb-4 uppercase tracking-[0.3em]">Our Menu</h1>
          <div className="w-12 h-px bg-white/50 mx-auto mb-4" />
          <p className="text-white/70 text-[9px] md:text-[10px] tracking-[0.4em] uppercase font-light">Luxury Cambodian Wellness</p>
        </div>
      </section>

      {/* CATEGORY TABS */}
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

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-16 relative">
        <div className="flex justify-start mb-6">
          <div className="flex border border-gray-200 rounded-lg p-1 gap-1 bg-white shadow-sm">
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-black text-white' : 'text-gray-300 hover:text-black'}`}
              title="List View"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            </button>
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-black text-white' : 'text-gray-300 hover:text-black'}`}
              title="Grid View"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            </button>
            <button 
              onClick={() => setViewMode('carousel')} 
              className={`p-2 rounded transition-colors ${viewMode === 'carousel' ? 'bg-black text-white' : 'text-gray-300 hover:text-black'}`}
              title="Carousel View"
            >
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="10" rx="2" ry="2"></rect></svg>
            </button>
          </div>
        </div>

        {viewMode === 'carousel' && (
          <>
            <button onClick={() => scrollCarousel('left')} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 backdrop-blur rounded-full shadow-md text-black border border-gray-100 hover:bg-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button onClick={() => scrollCarousel('right')} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 backdrop-blur rounded-full shadow-md text-black border border-gray-100 hover:bg-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </>
        )}

        <div 
          ref={scrollContainerRef}
          className={`
            transition-all duration-300
            ${viewMode === 'list' ? 'flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-6 lg:grid-cols-2' : ''}
            ${viewMode === 'grid' ? 'grid grid-cols-2 gap-3 md:gap-8 md:grid-cols-3 xl:grid-cols-4' : ''}
            ${viewMode === 'carousel' ? 'flex flex-nowrap overflow-x-auto gap-4 snap-x snap-mandatory pb-8 hide-scrollbar md:pb-8' : ''}
          `}
        >
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const isInBag = bag.some(b => b.id === item.id);
              const hasPromo = item.isMonthlyPromo && item.discountValue;
              const finalPrice = getCalculatedPrice(item);
              const isList = viewMode === 'list';
              const isGrid = viewMode === 'grid';
              const isCarousel = viewMode === 'carousel';

              return (
                <div 
                  key={item.id} 
                  className={`
                    group bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden md:hover:shadow-md transition-shadow
                    ${isList ? 'flex flex-row p-3 items-stretch min-h-36 h-auto' : 'flex flex-col'}
                    ${isCarousel ? 'w-72 md:w-80 shrink-0 snap-start' : 'w-full'}
                  `}
                >
                  {/* Container set to aspect-square */}
                  <div className={`
                    relative bg-gray-50 shrink-0 overflow-hidden
                    ${isList ? 'w-28 md:w-40 self-start rounded-md aspect-square' : ''}
                    ${!isList ? 'w-full aspect-square' : ''}
                  `}>
                    
                    {hasPromo && (
                      <div className="absolute top-2 right-2 z-10 bg-[#D4AF37] text-white text-[8px] font-bold px-2 py-1 uppercase tracking-widest shadow-sm">
                        {item.discountType === 'percent' ? `${item.discountValue}% OFF` : `SAVE $${item.discountValue}`}
                      </div>
                    )}
                    
                    {/* Image set to object-contain so nothing gets cut off */}
                    <Image src={item.image || PLACEHOLDER_IMG} alt={item.name} fill className="object-contain transition-transform duration-700 md:group-hover:scale-105" />
                    
                    <div className="hidden xl:flex absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-end pb-4 justify-center px-4">
                      {isInBag ? (
                        <Link href="/book" className="w-full bg-black text-white py-3 text-[10px] font-bold tracking-[0.2em] uppercase text-center">View Bag</Link>
                      ) : (
                        <button onClick={() => handleAddToBag(item)} className="w-full bg-white text-black py-3 text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-gray-100 transition-colors">Add to Bag</button>
                      )}
                    </div>
                  </div>
                  
                  <div className={`
                    flex flex-col grow justify-between
                    ${isList ? 'pl-4 py-1' : 'p-3 md:p-4'}
                  `}>
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className={`font-bold text-black uppercase tracking-wider leading-tight pr-1 line-clamp-2 ${isList ? 'text-[11px] md:text-[13px]' : 'text-[11px] md:text-[13px]'}`}>
                          {item.name}
                        </h3>
                        
                        {/* Price Display Logic Updated Here */}
                        <div className="text-right shrink-0">
                          {hasPromo ? (
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] line-through text-gray-400">{item.price}</span>
                              <span className="text-[12px] font-playfair text-[#D4AF37] font-bold italic">{finalPrice}</span>
                            </div>
                          ) : (
                            <span className="text-[12px] font-playfair text-black italic mt-auto">{item.price}</span>
                          )}
                        </div>
                      </div>

                      <p className={`
                        text-gray-500 leading-relaxed font-light line-clamp-2 mb-2
                        ${isList ? 'text-[10px] md:text-[11px] block' : 'hidden md:block text-[11px]'}
                      `}>
                        {item.description || "A relaxing luxury treatment."}
                      </p>
                    </div>

                    <div className="flex justify-between items-center mt-auto">
                      <span className="text-[8px] uppercase tracking-widest text-gray-400 font-medium">{item.duration || "60 min"}</span>
                      
                      <button 
                        onClick={() => isInBag ? null : handleAddToBag(item)}
                        className={`xl:hidden text-[9px] font-bold uppercase tracking-widest rounded-sm transition-all
                          ${isInBag ? 'bg-gray-100 text-gray-400 cursor-default border-transparent px-3 py-2' : 
                            (isGrid ? 'w-full mt-2 py-2 border border-gray-200 active:bg-black active:text-white' : 'bg-black text-white px-3 py-2 active:scale-95')
                          }
                        `}
                      >
                        {isInBag ? 'Added' : (isGrid ? 'Add' : 'Add +')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
             <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400">
               <span className="text-2xl mb-2 opacity-50">❖</span>
               <p className="text-[11px] uppercase tracking-widest italic">No treatments found for {activeTab.toLowerCase()}.</p>
             </div>
          )}
        </div>
      </main>

      <button 
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-40 bg-black text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 transition-all duration-500 transform hover:bg-gray-800 ${showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}
      >
        <span className="text-[10px] font-bold uppercase tracking-widest">Back to Top</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
      </button>

    </div>
  );
};

export default TreatmentsPage;