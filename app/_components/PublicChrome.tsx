'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBag } from '../_context/BagContext';
import BrandLogo from './BrandLogo';
import styles from '../_pages/modern-homepage.module.css';

const links = [{ href: '/treatments', label: 'Treatments' }, { href: '/shop', label: 'Our products' }, { href: '/#our-approach', label: 'Our approach' }, { href: '/contact', label: 'Visit us' }];

function Arrow() {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12" /></svg>;
}

export function PublicHeader() {
  const pathname = usePathname();
  const { bag } = useBag();
  const menu = useRef<HTMLDialogElement>(null);
  return <>
    <a href="#main-content" className={styles.skipLink}>Skip to content</a>
    <div className={styles.announcement}><span>A little care goes a long way.</span><span>Beauty &amp; wellness · Phnom Penh</span></div>
    <header className={styles.header}>
      <Link href="/" className={styles.wordmark} aria-label="Premier Lounge home"><BrandLogo priority /></Link>
      <nav className={styles.desktopNav} aria-label="Main navigation">{links.map(link => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? 'page' : undefined}>{link.label}</Link>)}</nav>
      <div className={styles.headerActions}>
        <Link href="/book" className={styles.bagLink} aria-label={`Your visit, ${bag.length} items`}><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M6 8h12l1 13H5L6 8Zm3 0V6a3 3 0 0 1 6 0v2" /></svg>{bag.length > 0 && <span className={styles.bagCount}>{bag.length}</span>}</Link>
        <Link href="/book" className={styles.headerBooking}>Book a visit <Arrow /></Link>
        <button type="button" className={styles.menuButton} aria-label="Open navigation" aria-haspopup="dialog" aria-controls="public-navigation" onClick={() => menu.current?.showModal()}><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg></button>
      </div>
    </header>
    <dialog ref={menu} id="public-navigation" className={styles.mobileMenu} aria-label="Navigation">
      <div className={styles.mobileMenuTop}><Link href="/" aria-label="Premier Lounge home" onClick={() => menu.current?.close()}><BrandLogo /></Link><button type="button" className={styles.menuButton} aria-label="Close navigation" onClick={() => menu.current?.close()}>✕</button></div>
      <nav aria-label="Mobile navigation">{links.map(link => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? 'page' : undefined} onClick={() => menu.current?.close()}>{link.label}<Arrow /></Link>)}</nav>
      <Link href="/book" className={styles.primaryButton} onClick={() => menu.current?.close()}>Book your next visit <Arrow /></Link>
      <a href="https://t.me/premierlounge1" target="_blank" rel="noopener noreferrer" className={styles.textLink}>Talk to our team <Arrow /></a>
    </dialog>
  </>;
}

export function PublicFooter() {
  return <footer className={styles.footer}>
    <div className={styles.footerTop}>
      <Link href="/" className={styles.wordmark} aria-label="Premier Lounge home"><BrandLogo /></Link>
      <p>A little care. A little confidence.<br />A little more you.</p>
      <div><Link href="/treatments">Treatments <Arrow /></Link><Link href="/shop">Our products <Arrow /></Link><Link href="/book">Book a visit <Arrow /></Link><Link href="/contact">Contact <Arrow /></Link><a href="https://www.instagram.com/premierlounge_1/" target="_blank" rel="noopener noreferrer">Instagram <Arrow /></a><a href="https://www.facebook.com/share/14NgD5WSaLg/" target="_blank" rel="noopener noreferrer">Facebook <Arrow /></a></div>
    </div>
    <div className={styles.footerBottom}><span>© {new Date().getFullYear()} Premier Lounge</span><span>Beauty &amp; wellness, Phnom Penh</span><a href="https://t.me/premierlounge1" target="_blank" rel="noopener noreferrer">Talk to our team <Arrow /></a></div>
  </footer>;
}
