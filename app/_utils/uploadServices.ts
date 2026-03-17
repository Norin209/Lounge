import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// 📋 KOREAN SIGNATURE MENU DATA (With Khmer Translations)
const servicesToUpload = [
  { 
    name: "각종 여드름 치료 / ព្យាបាលមុនគ្រប់ប្រភេទ", 
    price: "$600", 
    category: "koreansignature", 
    description: "Various acne treatments / ព្យាបាលមុនគ្រប់ប្រភេទ", 
    order: 1 
  },
  { 
    name: "코 리프팅 / លើកខ្ទង់ច្រមុះ", 
    price: "$600", 
    category: "koreansignature", 
    description: "Nose lifting / លើកខ្ទង់ច្រមុះ", 
    order: 2 
  },
  { 
    name: "미간 주름 없애기 / បំបាត់ជ្រួញចន្លោះចិញ្ចើម", 
    price: "$400", 
    category: "koreansignature", 
    description: "Frown line removal / បំបាត់ជ្រួញចន្លោះចិញ្ចើម", 
    order: 3 
  },
  { 
    name: "이마 주름 없애기 / បំបាត់ជ្រួញថ្ងាស", 
    price: "$400", 
    category: "koreansignature", 
    description: "Forehead wrinkle removal / បំបាត់ជ្រួញថ្ងាស", 
    order: 4 
  },
  { 
    name: "목 주름 리프팅 / បន្តឹងស្បែកក", 
    price: "$400", 
    category: "koreansignature", 
    description: "Neck wrinkle lifting / បន្តឹងស្បែកក", 
    order: 5 
  },
  { 
    name: "인중 주름 탄력 / បន្តឹងស្បែកចន្លោះច្រមុះនិងមាត់", 
    price: "$200", 
    category: "koreansignature", 
    description: "Philtrum wrinkle elasticity / បន្តឹងស្បែកចន្លោះច្រមុះនិងមាត់", 
    order: 6 
  },
  { 
    name: "눈가 주름 없애기 / បំបាត់ជ្រួញជុំវិញភ្នែក", 
    price: "$50", 
    category: "koreansignature", 
    description: "Eye wrinkle removal / បំបាត់ជ្រួញជុំវិញភ្នែក", 
    order: 7 
  },
  { 
    name: "튼 살, 배 지방 없애기 / បំបាត់សង្វារ និងខ្លាញ់ក្បាលពោះ", 
    price: "$700", 
    category: "koreansignature", 
    description: "Stretch marks and belly fat removal / បំបាត់សង្វារ និងខ្លាញ់ក្បាលពោះ", 
    order: 8 
  }
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
        isPaused: false,
        discountValue: '',
        discountType: 'percent',
        duration: '60 min',
        createdAt: serverTimestamp()
      });
      count++;
    }
    console.log(`✅ ${count} new bilingual services added safely!`);
    return { success: true, count };
  } catch (error) {
    console.error("Error uploading services:", error);
    return { success: false, error };
  }
};