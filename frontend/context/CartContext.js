"use client";
import { createContext, useContext, useState, useCallback } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [restaurantInfo, setRestaurantInfo] = useState(null);

  const addToCart = useCallback((item, restaurant) => {
    setCart((prevCart) => {
      // Set restaurant info if first item or different restaurant
      if ((prevCart.length === 0 || 
          (restaurantInfo && restaurantInfo.id !== restaurant.id)) && 
          restaurant) {
        setRestaurantInfo({
          id: restaurant.id.toString(),
          name: restaurant.name.trim(),
          slug: restaurant.slug.trim()
        });
      }

      const newItem = { 
        ...item,
        id: item.id || item._id || crypto.randomUUID(),
        restaurantId: restaurant?.id?.toString() || item.restaurantId?.toString(),
        restaurantName: restaurant?.name?.trim() || item.restaurantName?.trim(),
        restaurantSlug: restaurant?.slug?.trim() || item.restaurantSlug?.trim(),
        quantity: item.quantity || 1
      };

      const existingItem = prevCart.find((cartItem) => cartItem.id === newItem.id);
  
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === newItem.id
            ? { ...cartItem, quantity: cartItem.quantity + (item.quantity || 1) }
            : cartItem
        );
      }
      return [...prevCart, newItem];
    });
  }, [restaurantInfo]);

  const removeFromCart = useCallback((id) => {
    setCart((prevCart) => {
      const newCart = prevCart.filter((item) => item.id !== id);
      if (newCart.length === 0) setRestaurantInfo(null);
      return newCart;
    });
  }, []);

  const updateQuantity = useCallback((id, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
    setRestaurantInfo(null);
  }, []);

  const getCartItemCount = useCallback(() => {
    return cart.reduce((acc, item) => acc + (item.quantity || 1), 0);
  }, [cart]);

  const getCartTotal = useCallback(() => {
    return cart.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0);
  }, [cart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        restaurantInfo,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartItemCount,
        getCartTotal,
        setRestaurantInfo
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);