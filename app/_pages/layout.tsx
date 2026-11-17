'use client';

import { PublicHeader, PublicFooter } from '../_components/PublicChrome';
import homeStyles from './modern-homepage.module.css';
import styles from './public-pages.module.css';
import Navbar from '../_components/Navbar';
import Footer from '../_components/Footer';

export default function PageLayout({
  children,
  classic = false,
}: {
  children: React.ReactNode;
  classic?: boolean;
}) {
  if (classic) return <div className="flex flex-col min-h-screen bg-white"><Navbar /><main className="grow">{children}</main><Footer /></div>;
  return (
    <div className={`${homeStyles.home} ${styles.shell}`}>
      
      <PublicHeader />
      
      <main id="main-content" className={styles.pageContent}>
        {children}
      </main>

      <PublicFooter />
    </div>
  );
}
