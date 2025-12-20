'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useBag } from '../_context/BagContext';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { bag } = useBag(); // Integrated your bag state

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when a link is clicked
  const closeMenu = () => setMobileMenuOpen(false);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Treatments', href: '/treatments' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <>
      <nav 
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          scrolled ? 'bg-white shadow-md py-4' : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          
          {/* Logo */}
          <Link href="/" className={`text-xl font-playfair tracking-[0.3em] uppercase transition-colors ${
            scrolled ? 'text-black' : 'text-white'
          }`}>
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

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <Link href="/book" className={`text-[10px] font-bold tracking-widest ${scrolled ? 'text-black' : 'text-white'}`}>
                BAG({bag.length})
            </Link>
            <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`transition-colors ${scrolled ? 'text-black' : 'text-white'}`}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {mobileMenuOpen ? (
                        <path d="M18 6L6 18M6 6l12 12" /> // X Icon
                    ) : (
                        <>
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </>
                    )}
                </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-40 bg-white transition-transform duration-500 md:hidden ${
        mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col items-center justify-center h-full gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.name}
              href={link.href} 
              onClick={closeMenu}
              className="text-lg font-playfair tracking-[0.2em] uppercase text-black"
            >
              {link.name}
            </Link>
          ))}
          <Link 
            href="/book" 
            onClick={closeMenu}
            className="mt-4 px-10 py-4 border border-black text-[10px] font-bold tracking-[0.3em] uppercase text-black hover:bg-black hover:text-white transition-all"
          >
            Book Now ({bag.length})
          </Link>
        </div>
      </div>
    </>
  );
};

export default Navbar;