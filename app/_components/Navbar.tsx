'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useBag } from '../_context/BagContext';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { bag } = useBag();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [mobileMenuOpen]);

  const closeMenu = () => setMobileMenuOpen(false);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Treatments', href: '/treatments' },
    { name: 'Shop', href: '/shop' }, // 🟢 Added Shop Link
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <>
      <nav 
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          scrolled || mobileMenuOpen ? 'bg-white shadow-md py-4' : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Link 
            href="/" 
            onClick={closeMenu}
            className={`text-xl font-playfair tracking-[0.3em] uppercase transition-colors ${
              scrolled || mobileMenuOpen ? 'text-black' : 'text-white'
            }`}
          >
            Glisten Lounge
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-10 items-center">
            {navLinks.map((link) => (
              <Link 
                key={link.name}
                href={link.href} 
                className={`text-[10px] font-bold tracking-[0.2em] uppercase transition-colors ${
                  scrolled ? 'text-gray-600 hover:text-black' : 'text-white/80 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            ))}
            
            <Link 
              href="/book" 
              className={`px-6 py-2 border text-[10px] font-bold tracking-[0.2em] uppercase transition-all ${
                scrolled 
                  ? 'border-black text-black hover:bg-black hover:text-white' 
                  : 'border-white text-white hover:bg-white hover:text-black'
              }`}
            >
              Book Now {bag.length > 0 && `(${bag.length})`}
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-6">
            {!mobileMenuOpen && (
              <Link href="/book" className={`text-[10px] font-bold tracking-widest transition-colors ${scrolled ? 'text-black' : 'text-white'}`}>
                  BAG({bag.length})
              </Link>
            )}
            <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`transition-colors p-2 -mr-2 ${scrolled || mobileMenuOpen ? 'text-black' : 'text-white'}`}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    {mobileMenuOpen ? (
                        <path d="M18 6L6 18M6 6l12 12" />
                    ) : (
                        <path d="M4 8h16M4 16h16" />
                    )}
                </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-40 bg-white transition-all duration-500 md:hidden ${
        mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
      }`}>
        <div className="flex flex-col items-center justify-center h-full gap-12 px-6 text-center font-sans">
          <div className="space-y-8">
            {navLinks.map((link) => (
              <Link 
                key={link.name}
                href={link.href} 
                onClick={closeMenu}
                className="block text-2xl font-playfair tracking-[0.2em] uppercase text-black"
              >
                {link.name}
              </Link>
            ))}
          </div>
          <Link 
            href="/book" 
            onClick={closeMenu}
            className="w-full max-w-xs py-5 bg-black text-white text-[10px] font-bold tracking-[0.3em] uppercase transition-all"
          >
            Checkout ({bag.length})
          </Link>
        </div>
      </div>
    </>
  );
};

export default Navbar;