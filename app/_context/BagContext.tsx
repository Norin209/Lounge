'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Treatment {
  id: string;
  name: string;
  price: string;
  duration: string;
  category: string;
  image: string;
}

interface BagContextType {
  bag: Treatment[];
  addToBag: (item: Treatment) => void;
  removeFromBag: (id: string) => void;
  clearBag: () => void; // <--- ADDED THIS LINE
}

const BagContext = createContext<BagContextType | undefined>(undefined);

export const BagProvider = ({ children }: { children: React.ReactNode }) => {
  const [bag, setBag] = useState<Treatment[]>([]); 

  useEffect(() => {
    const saved = localStorage.getItem('glisten_bag');
    if (saved) setBag(JSON.parse(saved));
  }, []);

  const addToBag = (item: Treatment) => {
    // Optional: Prevent duplicates if needed
    if (bag.some(i => i.id === item.id)) return;
    
    const updated = [...bag, item];
    setBag(updated);
    localStorage.setItem('glisten_bag', JSON.stringify(updated));
  };

  const removeFromBag = (id: string) => {
    const updated = bag.filter((i) => i.id !== id);
    setBag(updated);
    localStorage.setItem('glisten_bag', JSON.stringify(updated));
  };

  // <--- ADDED THIS FUNCTION
  const clearBag = () => {
    setBag([]);
    localStorage.removeItem('glisten_bag');
  };

  return (
    // <--- ADDED clearBag TO VALUE
    <BagContext.Provider value={{ bag, addToBag, removeFromBag, clearBag }}>
      {children}
    </BagContext.Provider>
  );
};

export const useBag = () => {
  const context = useContext(BagContext);
  if (!context) throw new Error("useBag must be used within a BagProvider");
  return context;
};