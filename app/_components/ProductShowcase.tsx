'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '../_utils/firebase';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { useBag } from '../_context/BagContext';

const productPlaceholder = "https://images.unsplash.com/photo-1612196808214-b7e239e5f6b7?q=80&w=800&auto=format&fit=crop";

interface ProductItem {
  id: string;
  name: string;
  category: string;
  price: string;
  image?: string;
  // Promo fields
  promoPrice?: string;      
  isMonthlyPromo?: boolean; 
  discountValue?: string;
  discountType?: 'percent' | 'fixed';
}

const ProductShowcase = () => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { addToBag, bag } = useBag();

  // 🟢 1. FETCH PRODUCTS (Limit to 3 for the showcase)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, "products"), limit(3));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as ProductItem));
        setProducts(data);
      } catch (error) {
        console.error("Error fetching showcase products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // 🟢 2. PRICE CALCULATOR (Consistent with Shop Page)
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

  const handleAddToBag = (item: ProductItem) => {
    addToBag({
      id: item.id,
      name: item.name,
      price: getCalculatedPrice(item),
      category: item.category,
      duration: 'Standard', 
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

  if (loading) {
    return <div className="py-24 text-center text-xs uppercase tracking-widest text-gray-400">Loading Apothecary...</div>;
  }

  return (
    <section className="py-24 bg-stone-50">
      <div className="max-w-7xl mx-auto px-6 relative">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
          <div className="max-w-xl text-left">
            <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400 mb-3">Glisten Apothecary</h3>
            <h2 className="text-3xl md:text-4xl font-playfair text-gray-900 leading-tight">Natural Creations from <br /> the Cambodian Earth</h2>
          </div>
          <Link href="/shop" className="hidden md:block text-xs font-bold tracking-widest uppercase border-b border-black pb-1 hover:text-gray-600 transition-colors">
            Shop All Products
          </Link>
        </div>

        {/* Mobile Arrows */}
        <button onClick={() => scroll('left')} className="md:hidden absolute left-2 top-1/2 z-10 text-black/50">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <button onClick={() => scroll('right')} className="md:hidden absolute right-2 top-1/2 z-10 text-black/50">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>

        {/* PRODUCTS GRID */}
        <div 
          ref={scrollContainerRef}
          className="flex md:grid md:grid-cols-3 gap-8 overflow-x-auto hide-scrollbar snap-x snap-mandatory"
        >
          {products.length > 0 ? (
            products.map((product) => {
              const isInBag = bag.some(b => b.id === product.id);
              const finalPrice = getCalculatedPrice(product);
              const hasPromo = product.isMonthlyPromo && product.discountValue;

              return (
                <div key={product.id} className="min-w-[80%] md:min-w-0 snap-center group">
                  <div className="relative h-96 w-full bg-white overflow-hidden mb-6">
                    
                    {/* Promo Badge */}
                    {hasPromo && (
                       <div className="absolute top-3 right-3 z-10 bg-[#D4AF37] text-white text-[9px] font-bold px-2 py-1 uppercase tracking-widest shadow-sm">
                         {product.discountType === 'percent' ? `${product.discountValue}% OFF` : 'SALE'}
                       </div>
                    )}

                    <Image 
                      src={product.image || productPlaceholder} 
                      alt={product.name} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                    
                    {/* Add to Bag Overlay */}
                    <div className="absolute inset-x-0 bottom-0 bg-white/95 py-4 text-center translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex justify-center">
                       {isInBag ? (
                          <Link href="/book" className="text-xs font-bold tracking-widest uppercase text-black">
                            View Bag ➜
                          </Link>
                       ) : (
                          <button onClick={() => handleAddToBag(product)} className="text-xs font-bold tracking-widest uppercase text-black hover:text-gray-600">
                            Add to Bag +
                          </button>
                       )}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">{product.category}</p>
                    <h3 className="text-lg font-playfair text-gray-900 mb-2">{product.name}</h3>
                    
                    <div className="flex justify-center gap-2 items-baseline">
                      {hasPromo ? (
                        <>
                          <span className="text-xs text-gray-400 line-through">{product.price}</span>
                          <span className="text-sm font-bold text-[#D4AF37]">{finalPrice}</span>
                        </>
                      ) : (
                        <span className="text-sm font-bold text-gray-900">{product.price}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-3 text-center text-gray-400 py-10 italic">
              No products found. Add some in the Admin Dashboard!
            </div>
          )}
        </div>

        <div className="mt-12 text-center md:hidden">
          <Link href="/shop" className="inline-block border border-gray-900 px-8 py-3 text-xs font-bold tracking-widest uppercase">
            Shop All
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;