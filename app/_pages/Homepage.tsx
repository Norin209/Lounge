import Hero from "../_components/Hero";
// import About from "../_components/About"; 
import Promotions from "../_components/Promotions";
import TreatmentsPreview from "../_components/TreatmentsPreview";
import TreatmentMenu from "../_components/TreatmentMenu";
import ProductShowcase from "../_components/ProductShowcase";
//import Testimonials from "../_components/Testimonials";

// 👇 Import your new button
import TelegramButton from "../_components/TelegramButton"; 

const Homepage = () => {
  return (
    <>
      <Hero />
      <Promotions />    
      <TreatmentsPreview /> 
      <TreatmentMenu />
      <ProductShowcase />
      
      {/* 👇 Drop it right here */}
      <TelegramButton />
    </>
  );
};

export default Homepage;