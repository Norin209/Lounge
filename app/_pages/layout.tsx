'use client';

import Navbar from '../_components/Navbar';
import Footer from '../_components/Footer';

export default function PageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 🟢 min-h-screen ensures the page is at least as tall as the browser window
    <div className="flex flex-col min-h-screen bg-white">
      
      <Navbar />
      
      {/* 🟢 flex-grow pushes the footer down if there isn't much content */}
      <main className="grow">
        {children}
      </main>

      <Footer />
    </div>
  );
}