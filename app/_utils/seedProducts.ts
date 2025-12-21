import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// 🟢 THE FAKE MOCK DATA
const productsToSeed = [
  { 
    name: "Jasmine Rice Scrub", 
    category: "Body Care", 
    price: "$24.00", 
    size: "250g", 
    image: "https://images.unsplash.com/photo-1612196808214-b7e239e5f6b7?q=80&w=800", 
    description: "Gentle exfoliation with natural jasmine rice.",
    isMonthlyPromo: true, 
    discountValue: "20", 
    discountType: "percent" 
  },
  { 
    name: "Lemongrass Essential Oil", 
    category: "Aromatherapy", 
    price: "$18.00", 
    size: "30ml", 
    image: "https://images.unsplash.com/photo-1608248597279-f99d160bfbc8?q=80&w=800", 
    description: "Pure steam-distilled lemongrass to refresh your sanctuary.",
    isSignature: true 
  },
  { 
    name: "Coconut Body Butter", 
    category: "Body Care", 
    price: "$32.00", 
    size: "200ml", 
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800",
    description: "Rich hydration using local organic coconuts." 
  },
  { 
    name: "Herbal Compress Ball", 
    category: "Wellness", 
    price: "$15.00", 
    size: "1 unit", 
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=800",
    description: "Traditional Khmer herbal compress for muscle relief." 
  }
];

export const seedProducts = async () => {
  try {
    let count = 0;
    for (const p of productsToSeed) {
      await addDoc(collection(db, "products"), {
        ...p,
        isMonthlyPromo: p.isMonthlyPromo || false,
        isSignature: p.isSignature || false,
        discountValue: p.discountValue || '',
        discountType: p.discountType || 'percent',
        createdAt: serverTimestamp()
      });
      count++;
    }
    console.log(`✅ ${count} products seeded successfully!`);
    return { success: true, count };
  } catch (error) {
    console.error("Error seeding products:", error);
    return { success: false, error };
  }
};