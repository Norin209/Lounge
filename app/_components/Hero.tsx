'use client';

import Image from 'next/image';
import Link from 'next/link';

const Hero = () => {
  return (
    <section className="relative w-full h-screen overflow-hidden">
      
      {/* Background Image */}
      <Image 
        src="https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=2070&auto=format&fit=crop"
        alt="Bodia Spa Atmosphere"
        fill
        className="object-cover"
        priority
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/40 to-transparent" />

      {/* Text Content */}
      <div className="absolute top-1/2 left-6 md:left-20 transform -translate-y-1/2 text-white z-10 max-w-xl pr-6">
        
        <h2 className="text-[10px] md:text-sm font-bold tracking-[0.3em] mb-4 md:mb-6 text-white/80 uppercase">
          PREMIER LOUNGE A Cambodian Cocoon
        </h2>
        
        <h1 className="text-4xl md:text-7xl font-playfair font-medium leading-tight mb-8 text-white">
          A Sanctuary for <br />
          <span className="italic text-white/90">Mind, Body & Soul</span>
        </h1>

        {/* 👇 THE BUTTON: Links to the section with ID "treatments" */}
        <Link 
          href="/treatments"
          className="inline-block border border-white px-8 py-3 text-[10px] font-bold tracking-[0.2em] uppercase text-white hover:bg-white hover:text-black transition-colors duration-300"
        >
          View Treatments
        </Link>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 text-[10px] tracking-widest animate-bounce">
        SCROLL
      </div>
    </section>
  );
};

export default Hero;