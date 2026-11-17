'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../_utils/firebase';
import { useBag } from '../_context/BagContext';
import styles from './modern-homepage.module.css';
import { PublicHeader, PublicFooter } from '../_components/PublicChrome';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=85&w=1600&auto=format&fit=crop';
const TREATMENT_IMAGE = 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=85&w=1000&auto=format&fit=crop';
const RITUAL_IMAGE = 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=85&w=900&auto=format&fit=crop';
const TELEGRAM = 'https://t.me/premierlounge1';
const DIRECTIONS = 'https://www.google.com/maps/search/?api=1&query=Premier+Lounge+HV8C%2B9C8+Phnom+Penh';

type Service = {
  id: string;
  name: string;
  category: string;
  price: string;
  image: string;
  duration: string;
  description: string;
  isSignature: boolean;
  isMonthlyPromo: boolean;
  isPaused: boolean;
  promoPrice: string;
  discountValue: string;
  discountType: string;
  order: number;
};
type Category = { id: string; label: string; image?: string };
const CATEGORY_DETAILS = [
  { id: 'hair', label: 'Hair', note: 'A fresh cut. A new feeling.', number: '01' },
  { id: 'facial', label: 'Face', note: 'A little care, a little glow.', number: '02' },
  { id: 'nails', label: 'Nails', note: 'The finishing touch.', number: '03' },
  { id: 'body', label: 'Body', note: 'Let your shoulders drop.', number: '04' },
];

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d={diagonal ? 'M6 18 18 6M6 6h12v12' : 'M4 12h16m-6-6 6 6-6 6'} /></svg>;
}

function Icon({ type }: { type: 'bag' | 'phone' | 'pin' | 'menu' | 'close' }) {
  const paths = {
    bag: 'M6 8h12l1 13H5L6 8Zm3 0V6a3 3 0 0 1 6 0v2',
    phone: 'M5 3h4l2 5-3 2a14 14 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2C10 21 3 14 3 5a2 2 0 0 1 2-2Z',
    pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Zm-5 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    menu: 'M4 7h16M4 12h16M4 17h16',
    close: 'm6 6 12 12M6 18 18 6',
  };
  return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[type]} /></svg>;
}

function servicePrice(service: Service) {
  const base = Number(service.price.replace(/[^\d.]/g, ''));
  const discount = Number(service.discountValue);
  if (service.isMonthlyPromo && service.discountValue && Number.isFinite(base) && Number.isFinite(discount) && discount >= 0) {
    const value = service.discountType === 'percent' ? base * (1 - Math.min(discount, 100) / 100) : base - discount;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Math.max(0, value));
  }
  return service.isMonthlyPromo && service.promoPrice ? service.promoPrice : service.price;
}

export default function ModernHomepage() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuError, setMenuError] = useState(false);
  const [notice, setNotice] = useState('');
  const { bag, addToBag } = useBag();

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [menu, categoryData] = await Promise.allSettled([
        getDocs(collection(db, 'services')),
        getDoc(doc(db, 'settings', 'service_categories')),
      ]);
      if (!active) return;
      if (menu.status === 'fulfilled') {
        setServices(menu.value.docs.map((item) => {
          const data = item.data();
          return {
            id: item.id, name: String(data.name ?? ''), category: String(data.category ?? ''),
            price: typeof data.price === 'number' ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.price) : String(data.price ?? ''),
            image: String(data.image ?? ''), duration: String(data.duration ?? ''), description: String(data.description ?? ''),
            isSignature: data.isSignature === true, isMonthlyPromo: data.isMonthlyPromo === true, isPaused: data.isPaused === true,
            promoPrice: String(data.promoPrice ?? ''), discountValue: String(data.discountValue ?? ''), discountType: String(data.discountType ?? ''),
            order: typeof data.order === 'number' ? data.order : 999,
          };
        }).filter((service) => service.name && !service.isPaused).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)));
      } else setMenuError(true);
      if (categoryData.status === 'fulfilled' && categoryData.value.exists()) {
        const list: unknown = categoryData.value.data().list;
        if (Array.isArray(list)) setCategories(list.filter((item): item is Category => Boolean(item && typeof item.id === 'string' && typeof item.label === 'string')));
      }
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, []);

  const signatures = services.filter((service) => service.isSignature);
  const featured = (signatures.length ? signatures : services).slice(0, 4);
  const promotion = services.find((service) => service.isMonthlyPromo);
  const categoryImage = (id: string) => categories.find((category) => category.id === id)?.image || services.find((service) => service.category === id && service.image)?.image || TREATMENT_IMAGE;

  function addService(service: Service) {
    addToBag({ id: service.id, name: service.name, category: service.category, price: servicePrice(service), duration: service.duration || 'Confirm with our team', image: service.image || TREATMENT_IMAGE });
    setNotice(`${service.name} added to your visit.`);
  }

  return (
    <div className={styles.home}>
      <PublicHeader />

      <main id="main-content">
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span /> YOUR EVERYDAY, A LITTLE MORE BEAUTIFUL</p>
            <h1 id="hero-title">A little time.<br /><em>All for you.</em></h1>
            <p className={styles.heroDescription}>A fresh look. A moment to unwind. Find your own kind of feel-good at Premier Lounge.</p>
            <div className={styles.heroButtons}><Link href="/book" className={styles.primaryButton}>Book an appointment <Arrow diagonal /></Link><Link href="#discover" className={styles.textLink}>Explore our treatments <Arrow /></Link></div>
            <div className={styles.heroFootnote}><span className={styles.smallFlower} aria-hidden="true">✳</span><p>Hair, nails, skin &amp; body.<br /><strong>Your beauty ritual, all in one place.</strong></p></div>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.heroImage}><Image src={HERO_IMAGE} alt="A peaceful spa treatment setting" fill priority sizes="(max-width: 760px) 100vw, 55vw" className={styles.coverImage} /><div className={styles.imageShade} /></div>
            <div className={styles.heroImageCaption}><span>MAKE ROOM FOR YOURSELF</span><span>PHNOM PENH, CAMBODIA</span></div>
            <div className={styles.heroNote}><span>Slow down.</span><em>You deserve this.</em><svg width="44" height="44" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true"><path d="M24 4v40M4 24h40M10 10l28 28M10 38l28-28M6 16l36 16M16 6l16 36M6 32l36-16M16 42 32 6" /></svg></div>
          </div>
        </section>

        <div className={styles.serviceRibbon} aria-label="Our services"><span>HAIR</span><i aria-hidden="true">✦</i><span>SKIN</span><i aria-hidden="true">✦</i><span>NAILS</span><i aria-hidden="true">✦</i><span>BODY</span><i aria-hidden="true">✦</i><span>A LITTLE YOU-TIME</span></div>

        <section id="discover" className={styles.section} aria-labelledby="discover-title">
          <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>FIND YOUR FEEL-GOOD</p><h2 id="discover-title">What brings <em>you in?</em></h2></div><p>From a small refresh to a full reset,<br />there’s a little something for every mood.</p></div>
          <div className={styles.categoryGrid}>{CATEGORY_DETAILS.map((category) => <Link href={`/treatments?category=${category.id}`} key={category.id} className={styles.categoryCard}><div className={styles.categoryImage}><Image src={categoryImage(category.id)} alt={`${category.label} treatments`} fill sizes="(max-width: 600px) 47vw, (max-width: 1000px) 45vw, 23vw" className={styles.coverImage} /><span className={styles.categoryNumber}>{category.number}</span><span className={styles.categoryArrow}><Arrow diagonal /></span></div><div className={styles.categoryCopy}><h3>{category.label}</h3><p>{category.note}</p></div></Link>)}</div>
          <div className={styles.sectionBottom}><p>Facials, lashes, waxing, make-up and more.</p><Link href="/treatments" className={styles.textLink}>See the full treatment menu <Arrow /></Link></div>
        </section>

        <section className={`${styles.section} ${styles.featuredSection}`} aria-labelledby="featured-title">
          <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>A LITTLE INSPIRATION</p><h2 id="featured-title">Make it <em>your ritual.</em></h2></div><Link href="/treatments" className={styles.textLink}>Explore all treatments <Arrow /></Link></div>
          <div className={styles.treatmentGrid}>
            {loading ? [1, 2, 3, 4].map((id) => <div className={styles.skeleton} key={id} aria-label="Loading treatments"><div /><span /><span /></div>) : featured.map((service) => {
              const added = bag.some((item) => item.id === service.id);
              return <article className={styles.treatmentCard} key={service.id}><Link href={`/treatments?category=${encodeURIComponent(service.category)}`} className={styles.treatmentImage} aria-label={`Explore ${service.name}`}><Image src={service.image || TREATMENT_IMAGE} alt={service.name} fill sizes="(max-width: 600px) 80vw, (max-width: 1000px) 45vw, 23vw" className={styles.coverImage} />{service.isSignature && <span className={styles.signatureTag}>SIGNATURE</span>}</Link><div className={styles.treatmentMeta}><span>{categories.find((category) => category.id === service.category)?.label || service.category}</span>{service.duration && <span>{service.duration}</span>}</div><div className={styles.treatmentTitle}><h3>{service.name}</h3>{service.price && <strong>{servicePrice(service)}</strong>}</div>{service.description && <p className={styles.treatmentDescription}>{service.description}</p>}<button type="button" className={styles.addButton} disabled={added} onClick={() => addService(service)}>{added ? 'Added to your visit' : 'Add to your visit'}<span aria-hidden="true">{added ? '✓' : '+'}</span></button></article>;
            })}
          </div>
          {!loading && !featured.length && <div className={styles.menuFallback}><p>{menuError ? 'Our treatment list is taking a little longer to load.' : 'Let’s find the right treatment for your visit.'}</p><Link href="/treatments" className={styles.textLink}>Browse our treatment menu <Arrow /></Link><a href={TELEGRAM} target="_blank" rel="noopener noreferrer" className={styles.textLink}>Ask our team <Arrow diagonal /></a></div>}
          <p className={styles.liveNotice} role="status" aria-live="polite">{notice}</p>
        </section>

        <section id="our-approach" className={styles.approach} aria-labelledby="approach-title"><div className={styles.approachImage}><Image src={RITUAL_IMAGE} alt="Skincare products and a simple self-care ritual" fill sizes="(max-width: 760px) 100vw, 42vw" className={styles.coverImage} /><span>THE BEAUTY OF TAKING A MOMENT</span></div><div className={styles.approachCopy}><p className={styles.eyebrow}>THE PREMIER WAY</p><h2 id="approach-title">A fresh look.<br /><em>A softer pace.</em></h2><p>Some days call for a little change. Others call for a little quiet. Make space for both, with hair, skin, nail and body care brought together in one visit.</p><div className={styles.approachPoints}><div><span>01</span><p><strong>Find what feels right</strong>Explore the menu, with prices and treatment details up front.</p></div><div><span>02</span><p><strong>Make the visit yours</strong>Add your favourite treatments and plan them together.</p></div><div><span>03</span><p><strong>A conversation away</strong>Not sure where to start? Our team can help you choose.</p></div></div><a href={TELEGRAM} target="_blank" rel="noopener noreferrer" className={styles.textLink}>Let’s plan your visit <Arrow diagonal /></a></div></section>

        {promotion && <section className={styles.offer} aria-labelledby="offer-title"><div className={styles.offerCopy}><p className={styles.eyebrow}>THIS MONTH, JUST FOR YOU</p><h2 id="offer-title">A little <em>something extra.</em></h2><h3>{promotion.name}</h3>{promotion.description && <p>{promotion.description}</p>}<div className={styles.offerPrice}>{servicePrice(promotion) !== promotion.price && <del>{promotion.price}</del>}<strong>{servicePrice(promotion)}</strong>{promotion.duration && <span>{promotion.duration}</span>}</div><button type="button" className={styles.primaryButton} disabled={bag.some((item) => item.id === promotion.id)} onClick={() => addService(promotion)}>{bag.some((item) => item.id === promotion.id) ? 'Added to your visit' : 'Add this special to your visit'}<Arrow diagonal /></button><Link href="/treatments?category=PROMOTIONS" className={styles.textLink}>View all current offers <Arrow /></Link></div><div className={styles.offerImage}><Image src={promotion.image || TREATMENT_IMAGE} alt={promotion.name} fill sizes="(max-width: 760px) 100vw, 45vw" className={styles.coverImage} /></div></section>}

        <section className={styles.productNote}><span className={styles.smallFlower} aria-hidden="true">✳</span><div><p className={styles.eyebrow}>TAKE A LITTLE CARE HOME</p><h2>Good rituals <em>don’t stop here.</em></h2></div><Link href="/shop" className={styles.textLink}>Explore our products <Arrow /></Link></section>

        <section id="visit" className={styles.visit} aria-labelledby="visit-title"><div><p className={styles.eyebrow}>YOUR NEXT GOOD DAY STARTS HERE</p><h2 id="visit-title">See you <em>at Premier.</em></h2><p>Come for a treatment. Stay for a little you-time.<br />Find us on Phnom Penh Hanoi Friendship Boulevard.</p><div className={styles.visitButtons}><Link href="/book" className={styles.primaryButton}>Book your next visit <Arrow diagonal /></Link><a href={DIRECTIONS} target="_blank" rel="noopener noreferrer" className={styles.outlineButton}>Get directions <Icon type="pin" /></a></div></div><div className={styles.visitDetails}><div><span>FIND US</span><p>Premier Lounge<br />HV8C+9C8, Phnom Penh Hanoi Friendship Blvd (1019)<br />Phnom Penh, Cambodia</p></div><div><span>SAY HELLO</span><a href="tel:+85512216068">+855 12 216 068</a><a href="mailto:lepremierlounge@gmail.com">lepremierlounge@gmail.com</a></div><a href={TELEGRAM} target="_blank" rel="noopener noreferrer" className={styles.textLink}>Chat with us on Telegram <Arrow diagonal /></a></div></section>
      </main>

      <PublicFooter />

      <a href={TELEGRAM} target="_blank" rel="noopener noreferrer" className={styles.chatButton}>Let’s chat <Arrow diagonal /></a>
      <nav className={styles.mobileBookingBar} aria-label="Quick booking and contact"><Link href="/book">Book a visit <Arrow diagonal /></Link><a href="tel:+85512216068"><Icon type="phone" /> Call</a><a href={DIRECTIONS} target="_blank" rel="noopener noreferrer"><Icon type="pin" /> Directions</a></nav>
    </div>
  );
}
