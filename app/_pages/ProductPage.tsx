'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useBag } from '../_context/BagContext'; 
import { db } from '../_utils/firebase';
import { collection, getDocs } from 'firebase/firestore';

// 🟢 TEMPLATE CONSTANTS (Matched to TreatmentsPage)
const heroImage = "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=2070&auto=format&fit=crop";
const productPlaceholder = "https://images.unsplash.com/photo-1612196808214-b7e239e5f6b7?q=80&w=800&auto=format&fit=crop";

interface ProductItem {
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
  size?: string;
}

const tabs = ["ALL", "BODY CARE", "AROMATHERAPY", "APOTHECARY", "WELLNESS"];

const ProductPage = () => {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [products, setProducts] = useState<ProductItem[]>([]); 
  const [loading, setLoading] = useState(true);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tabContainerRef = useRef<HTMLDivElement>(null);
  const { addToBag, bag } = useBag();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as ProductItem));
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // CALCULATE PRICE - Reference template logic
  const getCalculatedPrice = (item: ProductItem) => {
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
    if (activeTab === "ALL") return products;
    return products.filter(item => item.category?.toUpperCase() === activeTab);
  }, [activeTab, products]);

  const handleAddToBag = (item: ProductItem) => {
    addToBag({
      id: item.id,
      name: item.name,
      price: getCalculatedPrice(item),
      category: item.category,
      duration: item.size || 'N/A', 
      image: item.image || productPlaceholder 
    });
  };

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

  if (loading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400">Loading Boutique...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-24">
      {/* 🟢 Hero Section matched to Treatments template */}
      <section className="relative h-[50vh] w-full flex items-center justify-center overflow-hidden">
        <Image src={heroImage} alt="Header" fill priority className="object-cover brightness-[0.4]" />
        <div className="relative z-10 text-center px-6">
          <h1 className="text-4xl md:text-5xl font-playfair text-white mb-4 uppercase tracking-[0.3em]">The Boutique</h1>
          <div className="w-12 h-px bg-white/50 mx-auto mb-4" />
          <p className="text-white/70 text-[10px] tracking-[0.4em] uppercase font-light">Handcrafted Cambodian Wellness</p>
        </div>
      </section>

      {/* 🟢 Sticky Nav with Arrows matched to TreatmentsPage */}
      <nav className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="relative max-w-7xl mx-auto px-6 py-6 group">
          <button 
            onClick={() => scrollTabs('left')}
            className="md:hidden absolute left-0 top-0 bottom-0 z-20 bg-linear-to-r from-white via-white to-transparent w-12 flex items-center justify-start pl-4 text-black hover:text-gray-600 appearance-none"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>

          <div 
             ref={tabContainerRef}
             className="flex overflow-x-auto justify-start md:justify-center gap-8 hide-scrollbar px-2 md:px-0 scroll-smooth"
          >
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap text-[10px] md:text-[11px] font-bold tracking-[0.2em] uppercase transition-all duration-300 border-b-2 pb-1 shrink-0 appearance-none ${activeTab === tab ? "text-black border-black" : "text-gray-400 border-transparent hover:text-black"}`}>
                {tab}
              </button>
            ))}
          </div>

          <button 
            onClick={() => scrollTabs('right')}
            className="md:hidden absolute right-0 top-0 bottom-0 z-20 bg-linear-to-l from-white via-white to-transparent w-12 flex items-center justify-end pr-4 text-black hover:text-gray-600 appearance-none"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 md:py-20 relative">
        <button onClick={() => scroll('left')} className="md:hidden absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 text-gray-800/60 hover:text-black">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>

        <div ref={scrollContainerRef} className="flex flex-nowrap overflow-x-auto gap-6 snap-x snap-mandatory pb-8 hide-scrollbar md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-x-10 md:gap-y-20 md:overflow-visible md:pb-0 md:snap-none">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const isInBag = bag.some(b => b.id === item.id);
              const hasPromo = item.isMonthlyPromo && item.discountValue;
              const finalPrice = getCalculatedPrice(item);
              
              // 🟢 IMAGE FIX: Logical OR to force placeholder if database link is broken
              const displayImage = (item.image && item.image.trim() !== '') ? item.image : productPlaceholder;

              return (
                <div key={item.id} className="group shrink-0 w-72 snap-start md:w-auto md:snap-align-none flex flex-col h-full">
                  <div className="relative aspect-4/5 overflow-hidden mb-6 bg-gray-50 shadow-sm shrink-0">
                    {hasPromo && (
                      <div className="absolute top-2 right-2 z-10 bg-[#D4AF37] text-white text-[9px] font-bold px-2 py-1 uppercase tracking-widest shadow-sm">
                        {item.discountType === 'percent' ? `${item.discountValue}% OFF` : `SAVE $${item.discountValue}`}
                      </div>
                    )}

                    <Image 
                      src={displayImage} 
                      alt={item.name} 
                      fill 
                      className="object-cover transition-transform duration-1000 group-hover:scale-105" 
                    />
                    
                    <div className="absolute inset-0 bg-black/10 md:bg-black/20 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex items-end pb-4 justify-center px-4">
                      {isInBag ? (
                        <Link href="/book" className="w-full bg-black text-white py-3 text-[10px] font-bold tracking-[0.2em] uppercase shadow-lg text-center hover:bg-gray-900 transition-colors rounded-none appearance-none">View Bag</Link>
                      ) : (
                        <button onClick={() => handleAddToBag(item)} className="w-full bg-white text-black py-3 text-[10px] font-bold tracking-[0.2em] uppercase shadow-lg hover:bg-gray-100 transition-colors rounded-none appearance-none">
                          Add to Bag
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col grow text-left">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-[13px] font-bold text-black uppercase tracking-widest leading-tight pr-4">{item.name}</h3>
                      <div className="text-right whitespace-nowrap">
                         {hasPromo ? (
                           <>
                             <span className="block text-[10px] text-gray-400 line-through decoration-gray-400">{item.price}</span>
                             <span className="text-[14px] font-playfair text-[#D4AF37] font-bold italic">{finalPrice}</span>
                           </>
                         ) : (
                           <span className="text-[14px] font-playfair text-black italic">{item.price}</span>
                         )}
                      </div>
                    </div>

                    <div className="mb-4 grow">
                      <p className="text-[11px] text-gray-500 leading-relaxed font-light line-clamp-3">
                        {item.description || "Handcrafted botanicals inspired by Cambodian heritage."}
                      </p>
                    </div>

                    <div className="flex justify-between items-center text-[9px] uppercase tracking-widest text-gray-400 font-medium mt-auto">
                      <span>{item.category}</span>
                      <span className="truncate">{item.size || "100ml"}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
             <div className="w-full col-span-full text-center text-gray-400 py-20 italic">Products not found in this category.</div>
          )}
        </div>

        <button onClick={() => scroll('right')} className="md:hidden absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 text-gray-800/60 hover:text-black">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </main>
    </div>
  );
};

export default ProductPage;