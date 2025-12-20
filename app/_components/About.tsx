import Image from 'next/image';
import Link from 'next/link';

const About = () => {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
        
        {/* Left: The Image */}
        {/* FIX: h-[400px] -> h-100 and md:h-[600px] -> md:h-150 */}
        <div className="relative h-100 md:h-150 w-full order-2 md:order-1">
          <div className="absolute top-4 left-4 w-full h-full border border-gray-200 z-0 hidden md:block" />
          
          <div className="relative h-full w-full z-10">
            <Image
              src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1000&auto=format&fit=crop"
              alt="Peaceful ambiance"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Right: The Text */}
        <div className="space-y-6 md:space-y-8 order-1 md:order-2">
          <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400">
            The Philosophy
          </h3>
          <h2 className="text-3xl md:text-5xl font-playfair text-black leading-tight">
            An Escape from <br/> the Ordinary
          </h2>
          <p className="text-gray-500 leading-relaxed font-light text-sm md:text-base">
            Nestled in the heart of the city, Glisten Lounge is more than a spa—it is a sanctuary. We blend ancient Cambodian healing traditions with modern wellness techniques to restore your inner balance.
          </p>
          
          <div className="pt-4">
            <Link href="/about" className="inline-block border-b border-black pb-1 text-xs font-bold tracking-widest uppercase hover:text-gray-600 transition-all">
              Read Our Story
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
};

export default About;