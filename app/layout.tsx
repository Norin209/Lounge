import "./globals.css";
import { BagProvider } from "./_context/BagContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Adding suppressHydrationWarning here handles extensions that modify the html tag
    <html lang="en" suppressHydrationWarning>
      {/* Adding it here handles extensions (like Grammarly) that inject attributes into the body */}
      <body suppressHydrationWarning>
        <BagProvider>
          {children}
        </BagProvider>
      </body>
    </html>
  );
}