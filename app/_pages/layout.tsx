import Navbar from "../_components/Navbar";
import Footer from "../_components/Footer";

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}