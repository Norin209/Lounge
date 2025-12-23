import { db } from './firebase';
import { collection, addDoc, getDocs, query, where, writeBatch } from 'firebase/firestore';

// 🟢 THE CLEANED DATA
const fullServiceList = [
  // --- PACKAGES ---
  { name: "16 Weeks Breakouts Recovery Package", price: "$129.00", category: "packages", description: "Acne Peel, 3x Acne Extraction + EMS, Acne Recovery Vitamin Facial, Weekly Consultation." },
  { name: "Armpit's Deal", price: "$99.00", category: "packages", description: "3 times, once every 3-4 weeks plus free underarm cream." },
  { name: "Beauty Buffet", price: "$400.00", category: "packages", description: "Unlimited access to select beauty treatments." },
  { name: "Glisten Signature Brightening Body Package", price: "$70.00", category: "packages", duration: "120 min", description: "Full body brightening treatment." },
  { name: "Premium Japanese Whitening Body Spa Package", price: "$110.00", category: "packages", duration: "120-150 min", description: "Japanese whitening techniques for full body." },
  { name: "Premium Korean Brightening Body Spa Package", price: "$110.00", category: "packages", duration: "120 min", description: "Korean brightening techniques for full body." },
  { name: "Relaxation + EMS Radiant Glow Package", price: "$50.00", category: "packages", description: "Relaxation massage combined with EMS facial technology." },
  { name: "Ultimate Hair Revival Package", price: "$180.00", category: "packages", description: "Complete hair restoration and treatment." },

  // --- FACIALS ---
  { name: "Acne Extraction + EMS Acne Recovery", price: "$33.75", category: "facial", duration: "55-70 min", description: "Deep extraction with EMS technology for acne recovery." },
  { name: "Acne Peel", price: "$24.50", category: "facial", duration: "45-60 min", description: "Chemical peel targeting active acne." },
  { name: "Backne Extraction Therapy", price: "$38.00", category: "facial", description: "Treatment for back acne." },
  { name: "Dermatologist Consultation", price: "$15.00", category: "facial", description: "Consultation fee (waived if treatment is performed)." },
  { name: "EMS Glow", price: "$26.25", category: "facial", description: "EMS treatment for glowing skin." },
  { name: "Exoregen Meso Therapy", price: "$400.00", category: "facial", description: "Advanced meso therapy for skin regeneration." },
  { name: "Mesotherapy Glow", price: "$220.00", category: "facial", description: "Mesotherapy focused on skin radiance." },
  { name: "Mesotherapy Melasma", price: "$300.00", category: "facial", description: "Targeted treatment for melasma." },
  { name: "Microneedling Glow", price: "$150.00", category: "facial", description: "Microneedling to boost collagen and glow." },
  { name: "Premium Glow Peel", price: "$70.00", category: "facial", duration: "45 min", description: "High-grade peel for immediate radiance." },
  { name: "The Acne Extraction Facial", price: "$19.00", category: "facial", duration: "45-60 min", description: "Standard acne extraction facial." },
  { name: "The EMS Acne Recovering Vitamin Facial", price: "$35.00", category: "facial", duration: "45 min", description: "Vitamin infusion with EMS for acne prone skin." },
  { name: "The EMS Barrier Repair Vitamin Facial", price: "$35.00", category: "facial", description: "Restores skin barrier with vitamins and EMS." },
  { name: "The EMS Radiant Glow Vitamin Facial", price: "$35.00", category: "facial", duration: "45 min", description: "Vitamin boost for radiant skin." },
  { name: "Underarm Botox Treatment", price: "$135.00", category: "facial", description: "Botox treatment for underarms." },

  // --- BODY & WAX ---
  { name: "Backne Extraction + EMS", price: "$90.00", category: "body", description: "Intensive back acne treatment with EMS." },
  { name: "Backne Peel", price: "$26.25", category: "body", description: "Peel treatment for back acne." },
  { name: "Bikini Wax", price: "$15.00", category: "wax", description: "Standard bikini line wax." },
  { name: "Body Massage + Scrub + Steam", price: "$41.25", category: "body", duration: "120 min", description: "Full relaxation combo." },
  { name: "Body Massage + Steam + Scrub", price: "$45.00", category: "body", duration: "120 min", description: "Extended massage and scrub session." },
  { name: "Body Wax (General)", price: "$15.00", category: "wax", description: "Waxing for various body parts." },
  { name: "Brazilian Wax", price: "$25.00", category: "wax", description: "Full Brazilian wax." },
  { name: "Cambodia Style Natural Scrub", price: "$25.00", category: "body", duration: "75-90 min", description: "Traditional natural scrub." },
  { name: "Chest Wax", price: "$15.00", category: "wax", description: "Waxing for chest area." },
  { name: "Chin Wax", price: "$3.00", category: "wax", description: "Waxing for chin." },
  { name: "Eyebrows Wax", price: "$5.00", category: "wax", description: "Shaping and waxing eyebrows." },
  { name: "Full Arm Wax", price: "$10.00", category: "wax", description: "Waxing for full arms." },
  { name: "Full Leg Wax", price: "$15.00", category: "wax", description: "Waxing for full legs." },
  { name: "Gold Brightening Body Spa", price: "$69.75", category: "body", duration: "90 min", description: "Luxurious gold body treatment." },
  { name: "Half Arm Wax", price: "$8.00", category: "wax", description: "Waxing for half arms." }, 
  { name: "Half Leg Wax", price: "$10.00", category: "wax", description: "Waxing for half legs." }, 
  { name: "Herbal Steam Avocado Detox", price: "$35.00", category: "body", duration: "75 min", description: "Detoxifying steam with avocado." },
  { name: "Herbal Steam Coffee Detox", price: "$35.00", category: "body", duration: "75 min", description: "Detoxifying steam with coffee." },
  { name: "Korean Style Exfoliating Scrub", price: "$25.00", category: "body", duration: "60 min", description: "Deep exfoliation Korean style." },
  { name: "Korean Underarm Brightening Spa", price: "$25.00", category: "body", description: "Brightening treatment for underarms." },
  { name: "Lip Wax", price: "$3.00", category: "wax", description: "Waxing for upper lip." },
  { name: "Relaxation Body Massage", price: "$30.00", category: "body", duration: "60 min", description: "Classic relaxation massage." },
  { name: "Sideburns Wax", price: "$3.00", category: "wax", description: "Waxing for sideburns." },
  { name: "Tan Removal Brightening Body Spa", price: "$60.00", category: "body", description: "Removes tan and brightens skin." },
  { name: "Underarm Peel", price: "$35.00", category: "body", description: "Peel for underarm brightening." },
  { name: "Underarm Wax", price: "$6.00", category: "wax", description: "Waxing for underarms." },

  // --- NAILS ---
  { name: "Basic Manicure", price: "$10.00", category: "nails", description: "Clean, shape, and polish." },
  { name: "Basic Pedicure", price: "$15.00", category: "nails", description: "Clean, shape, and polish for feet." },
  { name: "Callus Treatment", price: "$18.00", category: "nails", description: "Removal of calluses." },
  { name: "Gel Extension", price: "$15.00", category: "nails", description: "Gel nail extensions." },
  { name: "Gel Manicure", price: "$10.00", category: "nails", description: "Manicure with gel polish." },
  { name: "Gel Overlay", price: "$15.00", category: "nails", description: "Gel overlay on natural nails." },
  { name: "Gel Pedicure", price: "$10.00", category: "nails", description: "Pedicure with gel polish." },
  { name: "Gel Polish", price: "$8.00", category: "nails", description: "Gel polish application only." },
  { name: "Gel Removal", price: "$1.00", category: "nails", description: "Removal of gel polish." },
  { name: "Nail Extension Removal", price: "$6.00", category: "nails", description: "Removal of nail extensions." },
  { name: "Premium Japanese Spa-Manicure", price: "$30.00", category: "nails", description: "Luxury Japanese style manicure." },
  { name: "Premium Japanese Spa-Pedicure", price: "$35.00", category: "nails", description: "Luxury Japanese style pedicure." },
  { name: "Refill (Nails)", price: "$12.00", category: "nails", description: "Refill for gel/acrylic nails." },
  { name: "Signature Spa-Manicure", price: "$15.00", category: "nails", description: "Signature manicure treatment." },
  { name: "Signature Spa-Pedicure", price: "$20.00", category: "nails", description: "Signature pedicure treatment." },
  { name: "Stick On Nails", price: "$5.00", category: "nails", description: "Application of stick-on nails." },
  { name: "Lash Extension", price: "$30.00", category: "nails", description: "Eyelash extensions." },

  // --- HAIR ---
  { name: "Frozen Flat Iron Cryo Therapy", price: "$40.00", category: "hair", description: "Cryo therapy for hair health." },
  { name: "Hair Coloring", price: "$25.00", category: "hair", description: "Standard hair coloring." },
  { name: "Hair Cut", price: "$25.00", category: "hair", description: "Shampoo, cut, and styling." },
  { name: "Hair Gloss Protein Treatment", price: "$60.00", category: "hair", description: "Protein treatment for shine." },
  { name: "Keratin Hair Treatment", price: "$50.00", category: "hair", description: "Smoothing keratin treatment." },
  { name: "Permanent Hair Straightening", price: "$80.00", category: "hair", description: "Permanent straightening." },
  { name: "Radiant Hair Gloss Treatment", price: "$60.00", category: "hair", description: "Gloss treatment for hair." },
  { name: "Shampoo", price: "$5.00", category: "hair", description: "Wash and dry." },
  { name: "Shampoo + Massage", price: "$18.00", category: "hair", description: "Wash with head massage." },

  // --- CAR WASH ---
  { name: "Small Car Wash", price: "$10.00", category: "carwash", description: "Wash for small vehicles." },
  { name: "Medium Car Wash", price: "$12.00", category: "carwash", description: "Wash for medium vehicles." },
  { name: "Large Car Wash", price: "$15.00", category: "carwash", description: "Wash for large vehicles." },
  { name: "Motul Oil Changing", price: "$19.00", category: "carwash", description: "Oil change service (1L)." },
];

export const uploadFullServices = async () => {
  let count = 0;
  const addedIds: string[] = []; // 🟢 Track IDs of added items

  try {
    for (const service of fullServiceList) {
      const q = query(collection(db, "services"), where("name", "==", service.name));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        const docRef = await addDoc(collection(db, "services"), {
          ...service,
          isMonthlyPromo: false,
          isSignature: false,
          discountValue: "",
          discountType: "percent",
          image: "", 
          createdAt: new Date(),
        });
        
        addedIds.push(docRef.id); // 🟢 Save ID
        count++;
      }
    }
    // 🟢 Return both count AND the list of IDs
    return { success: true, count, addedIds };
  } catch (error) {
    console.error("Upload Error:", error);
    return { success: false, error, addedIds: [] };
  }
};