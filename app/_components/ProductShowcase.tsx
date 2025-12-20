'use client';
import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const products = [
  { id: 1, name: "Jasmine Rice Scrub", category: "Body Care", price: "$24.00", image: "https://images.unsplash.com/photo-1612196808214-b7e239e5f6b7?q=80&w=800&auto=format&fit=crop" },
  { id: 2, name: "Lemongrass Essential Oil", category: "Aromatherapy", price: "$18.00", image: "https://images.unsplash.com/photo-1608248597279-f99d160bfbc8?q=80&w=800&auto=format&fit=crop" },
  { id: 3, name: "Coconut Body Butter", category: "Moisturizer", price: "$32.00", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop" }
];

const ProductShowcase = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  return (
    <section className="py-24 bg-stone-50">
      <div className="max-w-7xl mx-auto px-6 relative">
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

        <div 
          ref={scrollContainerRef}
          className="flex md:grid md:grid-cols-3 gap-8 overflow-x-auto hide-scrollbar snap-x snap-mandatory"
        >
          {products.map((product) => (
            <div key={product.id} className="min-w-[80%] md:min-w-0 snap-center group cursor-pointer">
              <div className="relative h-96 w-full bg-white overflow-hidden mb-6">
                <Image src={product.image} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-x-0 bottom-0 bg-white/90 py-4 text-center translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <span className="text-xs font-bold tracking-widest uppercase">View Product</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">{product.category}</p>
                <h3 className="text-lg font-playfair text-gray-900 mb-2">{product.name}</h3>
                <p className="text-sm font-bold text-gray-900">{product.price}</p>
              </div>
            </div>
          ))}
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