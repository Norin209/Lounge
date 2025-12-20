// app/_pages/Homepage.tsx

import Hero from "../_components/Hero";
// import About from "../_components/About"; // 👈 Kept commented out for later!
import Promotions from "../_components/Promotions";
import TreatmentsPreview from "../_components/TreatmentsPreview";
import TreatmentMenu from "../_components/TreatmentMenu";
import ProductShowcase from "../_components/ProductShowcase";
import Testimonials from "../_components/Testimonials";

const Homepage = () => {
  return (
    <>
      <Hero />
      <Promotions />    
      <TreatmentsPreview /> 
      <TreatmentMenu />
      <ProductShowcase />
      <Testimonials />
    </>
  );
};

export default Homepage;