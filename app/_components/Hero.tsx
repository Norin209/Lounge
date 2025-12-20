import Image from 'next/image';

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
      {/* FIX: bg-gradient-to-r -> bg-linear-to-r */}
      <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/40 to-transparent" />

      {/* Text Content */}
      <div className="absolute top-1/2 left-6 md:left-20 transform -translate-y-1/2 text-white z-10 max-w-xl pr-6">
        
        <h2 className="text-[10px] md:text-sm font-bold tracking-[0.3em] mb-4 md:mb-6 text-white/80 uppercase">
          A Cambodian Cocoon
        </h2>
        
        <h1 className="text-4xl md:text-7xl font-playfair font-medium leading-tight mb-8 text-white">
          A Sanctuary for <br />
          <span className="italic text-white/90">Mind, Body & Soul</span>
        </h1>

        <button className="hidden md:inline-block group border border-white px-10 py-4 text-sm font-bold tracking-[0.2em] uppercase transition-all duration-300 hover:bg-white hover:text-black">
          Discover More
        </button>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 text-[10px] tracking-widest animate-bounce">
        SCROLL
      </div>
    </section>
  );
};

export default Hero;