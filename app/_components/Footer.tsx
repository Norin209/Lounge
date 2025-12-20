import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-[#1a1a1a] text-white py-20 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* Column 1: Brand */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold tracking-widest uppercase">
            Glisten
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            A sanctuary for beauty, wellness, and calm. Reconnecting mind, body, and soul.
          </p>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h3 className="text-xs font-bold tracking-widest uppercase mb-6 text-gray-500">
            Discover
          </h3>
          <ul className="space-y-4 text-sm text-gray-300">
            <li><Link href="/" className="hover:text-white transition">Home</Link></li>
            <li><Link href="/treatments" className="hover:text-white transition">Our Menu</Link></li>
            <li><Link href="/about" className="hover:text-white transition">The Story</Link></li>
            <li><Link href="/gift-cards" className="hover:text-white transition">Gift Cards</Link></li>
          </ul>
        </div>

        {/* Column 3: Contact */}
        <div>
          <h3 className="text-xs font-bold tracking-widest uppercase mb-6 text-gray-500">
            Visit Us
          </h3>
          <ul className="space-y-4 text-sm text-gray-300">
            <li>123 Wellness Blvd, Siem Reap</li>
            <li>+855 12 345 678</li>
            <li>hello@glistenlounge.com</li>
          </ul>
        </div>

        {/* Column 4: Hours */}
        <div>
          <h3 className="text-xs font-bold tracking-widest uppercase mb-6 text-gray-500">
            Opening Hours
          </h3>
          <ul className="space-y-4 text-sm text-gray-300">
            <li className="flex justify-between">
              <span>Mon - Fri</span>
              <span>10:00 - 20:00</span>
            </li>
            <li className="flex justify-between">
              <span>Sat - Sun</span>
              <span>09:00 - 22:00</span>
            </li>
          </ul>
        </div>

      </div>

      {/* Copyright */}
      <div className="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-gray-800 text-center text-xs text-gray-600">
        © 2025 Glisten Lounge. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;