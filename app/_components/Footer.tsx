import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-[#1a1a1a] text-white py-20 border-t border-gray-800 font-sans">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* Column 1: Brand & Socials */}
        <div className="space-y-6">
          <h2 className="text-2xl font-playfair font-bold tracking-widest uppercase">
            Premier
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed font-light">
            Where luxury meets wellness. Experience the finest Japanese and Korean spa treatments in the heart of Phnom Penh.
          </p>
          
          {/* SOCIAL ICONS (Added here) */}
          <div className="flex gap-4 pt-2">
            {/* Instagram */}
            <a 
              href="https://www.instagram.com/premierlounge_1/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Instagram"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
            {/* Facebook */}
            <a 
              href="https://www.facebook.com/share/14NgD5WSaLg/?mibextid=wwXIfr" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Facebook"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
            </a>
          </div>
        </div>

        {/* Column 2: Discover */}
        <div>
          <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase mb-8 text-gray-500">
            Discover
          </h3>
          <ul className="space-y-4 text-xs tracking-wide text-gray-300">
            <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
            <li><Link href="/services" className="hover:text-white transition-colors">Services</Link></li>
            <li><Link href="/gallery" className="hover:text-white transition-colors">Gallery</Link></li>
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
              Premier Lounge<br />
              Toul Kork District,<br />
              St 315, Phnom Penh
            </li>
            <li>
              {/* Added !text-gray-300 to stop Safari from turning it blue */}
              <a href="tel:01226068" className="hover:text-white transition-colors text-gray-300! no-underline">
                012 260 68
              </a>
            </li>
            <li>
              <a href="mailto:lepremierlounge@gmail.com" className="hover:text-white transition-colors text-gray-300! no-underline lowercase">
                lepremierlounge@gmail.com
              </a>
            </li>
          </ul>
        </div>

        {/* Column 4: Hours */}
        <div>
          <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase mb-8 text-gray-500">
            Lounge Hours
          </h3>
          <ul className="space-y-4 text-xs tracking-wide text-gray-300">
            <li className="flex justify-between max-w-50">
              <span>Mon – Fri</span>
              <span className="text-white">09:00 – 21:00</span>
            </li>
            <li className="flex justify-between max-w-50]">
              <span>Sat – Sun</span>
              <span className="text-white">10:00 – 22:00</span>
            </li>
            <li className="pt-4 text-gray-500 italic lowercase tracking-normal">
              Open daily for your wellness needs.
            </li>
          </ul>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-gray-800/50 text-center text-[10px] tracking-widest text-gray-600 uppercase">
        © 2026 Premier Lounge. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;