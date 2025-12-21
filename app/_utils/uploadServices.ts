import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// 📋 YOUR REAL MASTER MENU DATA
const servicesToUpload = [
  // --- 📦 PACKAGES ---
  { name: "1 Week Dream", price: "$128.00", category: "package", description: "Full revitalizing package including facial and body treatments." },
  { name: "Nymph's Deal", price: "$98.00", category: "package", description: "Complete pampering session." },
  { name: "Geisha's Secret", price: "$68.00", category: "package", description: "Traditional beauty rituals." },
  
  // --- 🌸 FACE ---
  { name: "Acne Extraction", price: "$15.75", category: "facial", description: "Professional extraction for clear skin." },
  { name: "Acne Pro (45m)", price: "$25.00", category: "facial", description: "Intensive acne treatment." },
  { name: "Source Peel", price: "$35.00", category: "facial", description: "Deep exfoliation peel." },
  { name: "Gold Mask", price: "$7.00", category: "facial", description: "Luxurious gold mask add-on." },
  { name: "Rose Petals Mask", price: "$7.00", category: "facial", description: "Soothing rose mask add-on." },
  { name: "Beauty Buffet", price: "$39.00", category: "facial", description: "Customized facial buffet." },
  { name: "The 24K Gold", price: "$25.00", category: "facial", description: "Premium gold facial treatment." },
  { name: "Luminous Skin", price: "$35.00", category: "facial", description: "Brightening treatment for glowing skin." },

  // --- 💆‍♀️ BODY ---
  { name: "Body Massage (60m)", price: "$15.00", category: "body", description: "Relaxing full body massage." },
  { name: "Body Massage (90m)", price: "$22.00", category: "body", description: "Extended full body massage." },
  { name: "Body Scrub", price: "$15.00", category: "body", description: "Exfoliating body scrub." },
  { name: "Aroma Massage", price: "$20.00", category: "body", description: "Massage with essential oils." },
  { name: "Slimming Massage", price: "$25.00", category: "body", description: "Targeted contouring massage." },
  
  // --- 💅 NAILS ---
  { name: "Gel Manicure", price: "$10.00", category: "nails", description: "Long-lasting gel polish for hands." },
  { name: "Gel Pedicure", price: "$10.00", category: "nails", description: "Long-lasting gel polish for feet." },
  { name: "Normal Manicure", price: "$5.00", category: "nails", description: "Classic polish for hands." },
  { name: "Normal Pedicure", price: "$5.00", category: "nails", description: "Classic polish for feet." },
  { name: "Gel Removal", price: "$3.00", category: "nails", description: "Safe removal of gel polish." },
  { name: "Cut & File", price: "$3.00", category: "nails", description: "Shaping and filing only." },
  { name: "Spa Manicure", price: "$15.00", category: "nails", description: "Includes scrub and massage." },
  { name: "Spa Pedicure", price: "$15.00", category: "nails", description: "Includes scrub and massage." },

  // --- 💇‍♀️ HAIR ---
  { name: "Hair Cut", price: "$10.00", category: "hair", description: "Professional cut and style." },
  { name: "Hair Spa", price: "$15.00", category: "hair", description: "Deep conditioning treatment." },
  { name: "Hair Coloring", price: "$35.00", category: "hair", description: "Full hair coloring (starting price)." },
  { name: "Wash & Blow", price: "$6.00", category: "hair", description: "Shampoo and blow dry." },

  // --- 🕯️ WAXING ---
  { name: "Half Arm Wax", price: "$10.00", category: "wax", description: "Smooth skin for half arms." },
  { name: "Full Arm Wax", price: "$15.00", category: "wax", description: "Smooth skin for full arms." },
  { name: "Half Leg Wax", price: "$12.00", category: "wax", description: "Smooth skin for half legs." },
  { name: "Full Leg Wax", price: "$18.00", category: "wax", description: "Smooth skin for full legs." },
  { name: "Underarm Wax", price: "$5.00", category: "wax", description: "Gentle underarm waxing." },

  // --- 🚗 CAR WASH ---
  { name: "Premium Wash", price: "$5.00", category: "carwash", description: "Exterior and interior clean." },
  { name: "VIP Wash", price: "$6.00", category: "carwash", description: "Premium wash with wax." },
  { name: "Motorbike Wash", price: "$2.50", category: "carwash", description: "Standard moto wash." }
];

const treatmentPlaceholder = "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=800";

export const uploadServices = async () => {
  try {
    let count = 0;
    for (const s of servicesToUpload) {
      await addDoc(collection(db, "services"), {
        ...s,
        image: treatmentPlaceholder, 
        isMonthlyPromo: false,
        isSignature: false,
        discountValue: '',
        discountType: 'percent',
        duration: '60 min',
        createdAt: serverTimestamp()
      });
      count++;
    }
    console.log(`✅ ${count} services uploaded successfully!`);
    return { success: true, count };
  } catch (error) {
    console.error("Error uploading services:", error);
    return { success: false, error };
  }
};