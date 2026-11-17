'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import PageIntro from '../_components/PageIntro';
import styles from './public-pages.module.css';
import { useBag } from '../_context/BagContext'; 
import { db } from '../_utils/firebase';
import { collection, getDocs } from 'firebase/firestore';

const HERO_IMAGE = "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=2070&auto=format&fit=crop";
const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1612196808214-b7e239e5f6b7?q=80&w=800&auto=format&fit=crop";

const TABS = ["ALL", "BODY CARE", "AROMATHERAPY", "APOTHECARY", "WELLNESS"];

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

const ProductPage = () => {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [products, setProducts] = useState<ProductItem[]>([]); 
  const [loading, setLoading] = useState(true);
  
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'carousel'>('list');
  const [showScrollTop, setShowScrollTop] = useState(false);

  const tabContainerRef = useRef<HTMLDivElement>(null); 
  const scrollContainerRef = useRef<HTMLDivElement>(null); 
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

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [activeTab, viewMode]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

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
      image: item.image || PLACEHOLDER_IMG 
    });
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400">Loading Boutique...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.catalogue}>
      
      <PageIntro eyebrow="Our products" title="A little care," accent="to take home." description="Keep your favourite rituals close. Explore our selection of body care, aromatherapy and everyday wellness essentials." image={HERO_IMAGE} imageAlt="A quiet spa setting for everyday wellness" />

      <div className={styles.filters}>
        <div className="relative max-w-7xl mx-auto px-4 py-4 group">
          
          <button 
            aria-label="Scroll categories left"
            onClick={() => scrollTabs('left')} 
            className="md:hidden absolute left-0 top-0 bottom-0 z-20 bg-linear-to-r from-white via-white/80 to-transparent w-10 flex items-center justify-center text-black hover:text-gray-600"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>

          <div 
            ref={tabContainerRef} 
            className="flex overflow-x-auto overflow-y-hidden
            justify-start md:justify-center
            gap-6 md:gap-10
            hide-scrollbar px-6 scroll-smooth
            [touch-action:pan-x]
            overscroll-x-contain
            [-webkit-overflow-scrolling:touch]"
          >
            {TABS.map((tab) => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                className={`whitespace-nowrap text-[10px] md:text-[11px] font-bold tracking-[0.15em] uppercase transition-all duration-300 border-b-2 pb-2 shrink-0 ${
                  activeTab === tab ? "text-black border-black scale-105" : "text-gray-400 border-transparent hover:text-black"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button 
            aria-label="Scroll categories right"
            onClick={() => scrollTabs('right')} 
            className="md:hidden absolute right-0 top-0 bottom-0 z-20 bg-linear-to-l from-white via-white/80 to-transparent w-10 flex items-center justify-center text-black hover:text-gray-600"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      </div>

      <div className={styles.results}>
        
        <div className={styles.resultsHeading}>
          <div><h2>{activeTab === 'ALL' ? 'The collection' : activeTab.toLowerCase()}</h2><p>{filteredItems.length} products to explore</p></div>
          <div className={styles.viewSwitch}>
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

              const displayImage = item.image && item.image.trim() !== '' ? item.image : PLACEHOLDER_IMG;

              return (
                <div 
                  key={item.id} 
                  className={`
                    group ${styles.catalogueCard}
                    ${isList ? 'flex flex-row p-3 items-stretch min-h-36 h-auto' : 'flex flex-col'}
                    ${isCarousel ? 'w-72 md:w-80 shrink-0 snap-start' : 'w-full'}
                  `}
                >
                  <div className={`
                    relative bg-gray-50 shrink-0
                    ${isList ? 'w-28 md:w-40 self-start rounded-md aspect-4/5' : ''}
                    ${!isList ? 'w-full aspect-4/5' : ''}
                  `}>
                    {hasPromo && (
                      <div className="absolute top-0 left-0 z-10 bg-[#8d6549] text-white text-[8px] font-bold px-2 py-1 uppercase tracking-widest shadow-sm">
                        {item.discountType === 'percent' ? `${item.discountValue}% OFF` : `-${item.discountValue}`}
                      </div>
                    )}
                    
                    <Image src={displayImage} alt={item.name} fill className="object-cover transition-transform duration-700 md:group-hover:scale-105" />
                    
                    {/* 🟢 CHANGED: md:flex -> xl:flex */}
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
                      <div className={styles.cardHeading}>
                        <h3 className={styles.cardTitle}>
                          {item.name}
                        </h3>
                        
                        <div className="text-right shrink-0">
                          {hasPromo ? (
                            <div className="flex flex-col items-end">
                              <span className="text-[12px] font-playfair text-[#8d6549] font-bold italic">{finalPrice}</span>
                              {!isGrid && <span className="text-[9px] line-through text-gray-400">{item.price}</span>}
                            </div>
                          ) : (
                            <span className={styles.cardPrice}>{item.price}</span>
                          )}
                        </div>
                      </div>

                      <p className={`
                        ${styles.cardDescription} line-clamp-2
                      `}>
                        {item.description || "Handcrafted botanical wellness."}
                      </p>
                    </div>

                    <div className={styles.cardMeta}>
                      <span className="text-[11px] text-gray-500 font-medium">{item.size || "100ml"}</span>
                      
                      {/* 🟢 CHANGED: md:hidden -> xl:hidden */}
                      <button 
                        disabled={isInBag}
                        onClick={() => handleAddToBag(item)}
                        className={styles.cardAction}
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
               <p className="text-[11px] uppercase tracking-widest italic">No products found.</p>
             </div>
          )}
        </div>
      </div>

      <button 
        tabIndex={showScrollTop ? 0 : -1}
        aria-hidden={!showScrollTop}
        onClick={scrollToTop}
        className={`${styles.backToTop} fixed bottom-6 right-6 z-30 px-6 py-3 rounded-full shadow-xl flex items-center gap-2 transition-all duration-500 transform hover:bg-gray-800 ${showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}
      >
        <span className="text-[10px] font-bold uppercase tracking-widest">Back to Top</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
      </button>

    </div>
  );
};

export default ProductPage;
