// context/SpecialDishesContext.js
"use client"; // Add this directive at the top

import { createContext, useContext, useState } from 'react';

const SpecialDishesContext = createContext();

export function SpecialDishesProvider({ children }) {
  const [specialDishes, setSpecialDishes] = useState([]);
  
  return (
    <SpecialDishesContext.Provider value={{ specialDishes, setSpecialDishes }}>
      {children}
    </SpecialDishesContext.Provider>
  );
}

export function useSpecialDishesContext() {
  const context = useContext(SpecialDishesContext);
  if (!context) {
    throw new Error(
      'useSpecialDishesContext must be used within a SpecialDishesProvider'
    );
  }
  return context;
}