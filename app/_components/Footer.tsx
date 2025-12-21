import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-[#1a1a1a] text-white py-20 border-t border-gray-800 font-sans">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* Column 1: Brand */}
        <div className="space-y-6">
          <h2 className="text-2xl font-playfair font-bold tracking-widest uppercase">
            Glisten
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed font-light">
            A sanctuary for beauty, wellness, and calm in the heart of Phnom Penh. 
            Reconnecting mind, body, and soul through Cambodian tradition.
          </p>
        </div>

        {/* Column 2: Discover */}
        <div>
          <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase mb-8 text-gray-500">
            Discover
          </h3>
          <ul className="space-y-4 text-xs tracking-wide text-gray-300">
            <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
            <li><Link href="/treatments" className="hover:text-white transition-colors">Treatments</Link></li>
            <li><Link href="/shop" className="hover:text-white transition-colors">Shop Apothecary</Link></li>
            <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
          </ul>
        </div>

        {/* Column 3: Visit Us */}
        <div>
          <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase mb-8 text-gray-500">
            Visit Us
          </h3>
          <ul className="space-y-4 text-xs tracking-wide text-gray-300 leading-loose">
            <li>
              Glisten Lounge Carwash Cafe Spa<br />
              Hanoi Friendship Blvd (1019),<br />
              Phnom Penh, Cambodia
            </li>
            <li>+855 89 698 788</li>
            <li>hello@glistenlounge.com</li>
          </ul>
        </div>

        {/* Column 4: Hours */}
        <div>
          <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase mb-8 text-gray-500">
            Lounge Hours
          </h3>
          <ul className="space-y-4 text-xs tracking-wide text-gray-300">
            <li className="flex justify-between">
              <span>Monday – Sunday</span>
              <span className="text-white">07:00 – 21:00</span>
            </li>
            <li className="pt-4 text-gray-500 italic lowercase tracking-normal">
              Open daily for your wellness needs.
            </li>
          </ul>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-gray-800/50 text-center text-[10px] tracking-widest text-gray-600 uppercase">
        © 2025 Glisten Lounge Carwash Cafe Spa. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;