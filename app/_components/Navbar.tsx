'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBag } from '../_context/BagContext';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const { bag } = useBag();

  // 🟢 1. DETECT SCROLL TO CHANGE BACKGROUND
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // 🟢 DYNAMIC COLOR LOGIC
  const isLightMode = isScrolled || isMobileOpen;

  const textColor      = isLightMode ? 'text-black' : 'text-white';
  const inactiveColor  = isLightMode ? 'text-black' : 'text-white'; 
  const hoverColor     = isLightMode ? 'group-hover:text-black' : 'group-hover:text-white';
  const underlineColor = isLightMode ? 'bg-black' : 'bg-white';
  const burgerColor    = isLightMode ? 'bg-black' : 'bg-white';

  // 🟢 CORRECTED LINKS: Label is "Products", Link is "/shop"
  const navLinks = [
    { name: 'Treatments', href: '/treatments' },
    { name: 'Products', href: '/shop' }, // 👈 Points to src/app/shop/page.tsx
    { name: 'Contact Us', href: '/contact' },
    { name: 'Book Now', href: '/book' },
  ];

  return (
    <>
      {/* 🟢 TOP BAR */}
      <div className={`
        fixed top-0 w-full z-50 bg-black text-white text-[9px] uppercase tracking-[0.2em] font-bold text-center py-2 transition-all duration-500
        ${isScrolled ? '-translate-y-full' : 'translate-y-0'}
      `}>
        Open Daily: 10am - 9pm • Phnom Penh
      </div>

      {/* 🟢 MAIN NAVBAR */}
      <nav className={`
        fixed w-full z-40 transition-all duration-500 border-b border-transparent
        ${isScrolled ? 'top-0 bg-white/90 backdrop-blur-md border-gray-100 py-4 shadow-sm' : 'top-8 bg-transparent py-6'}
      `}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          
          {/* 1. LEFT: LOGO */}
          <Link href="/" className={`text-2xl font-playfair font-bold tracking-tighter transition-colors duration-300 ${textColor}`}>
            GLISTEN.
          </Link>

          {/* 2. CENTER: DESKTOP LINKS */}
          <div className="hidden md:flex gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href} 
                className="relative group py-1"
              >
                <span className={`text-[10px] font-bold uppercase tracking-[0.15em] transition-colors duration-300 ${pathname === link.href ? textColor : `${inactiveColor} ${hoverColor}`}`}>
                  {link.name}
                </span>
                {/* ✨ Fancy Expanding Underline */}
                <span className={`absolute bottom-0 left-0 w-full h-px transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left ${underlineColor} ${pathname === link.href ? 'scale-x-100' : ''}`} />
              </Link>
            ))}
          </div>

          {/* 3. RIGHT: ICONS (Bag & Menu) */}
          <div className="flex items-center gap-6">
            {/* 🛒 Bag Icon */}
            <Link href="/book" className="relative group">
              <svg className={`w-5 h-5 transition-colors duration-300 ${textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
              {bag.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#D4AF37] text-white text-[8px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-bold">
                  {bag.length}
                </span>
              )}
            </Link>

            {/* 🍔 Mobile Hamburger (Animated) */}
            <button 
              onClick={() => setIsMobileOpen(!isMobileOpen)} 
              className="md:hidden flex flex-col justify-center items-center w-6 h-6 gap-1.5 z-50 group"
            >
              <span className={`block h-px w-6 transition-all duration-300 ${burgerColor} ${isMobileOpen ? 'rotate-45 translate-y-2.5' : ''}`} />
              <span className={`block h-px w-6 transition-all duration-300 ${burgerColor} ${isMobileOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-px w-6 transition-all duration-300 ${burgerColor} ${isMobileOpen ? '-rotate-45 -translate-y-2.5' : ''}`} />
            </button>
          </div>
        </div>
      </nav>

      {/* 🟢 MOBILE MENU OVERLAY */}
      <div className={`
        fixed inset-0 bg-white z-30 flex flex-col justify-center items-center gap-8 transition-all duration-500
        ${isMobileOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}
      `}>
        {navLinks.map((link) => (
          <Link 
            key={link.name} 
            href={link.href} 
            className="text-2xl font-playfair text-black hover:text-gray-500 transition-colors"
          >
            {link.name}
          </Link>
        ))}
        
        {/* Mobile Contact Info */}
        <div className="mt-10 text-center space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-gray-400">Open Daily</p>
            <p className="text-sm font-sans font-medium text-black">10:00 AM - 9:00 PM</p>
        </div>
      </div>
    </>
  );
}