"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";

const RestaurantContext = createContext();

export function RestaurantProvider({ children }) {
  const [state, setState] = useState({
    restaurants: [],
    selectedRestaurant: null,
    loading: true,
    error: null
  });

  // Fetch all restaurants on initial load
  const fetchRestaurants = useCallback(async (forceRefresh = false) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      // Add timestamp to force cache bypass if needed
      const url = forceRefresh 
        ? `/api/restaurants?t=${Date.now()}` 
        : "/api/restaurants";
        
      const response = await fetch(url, {
        cache: forceRefresh ? "no-store" : "default"
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch restaurants");
      }
      
      const data = await response.json();
      setState(prev => ({
        ...prev,
        restaurants: data,
        loading: false,
        error: null
      }));
      
      return data;
    } catch (err) {
      console.error("Error fetching restaurants:", err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message
      }));
      return [];
    }
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const fetchRestaurantBySlug = useCallback(async (slug) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      // Always fetch fresh data for individual restaurant
      const response = await fetch(`/api/restaurants?slug=${slug}&t=${Date.now()}`);
      if (!response.ok) throw new Error('Restaurant not found');
      
      const data = await response.json();
      if (!data) throw new Error('Invalid restaurant data');

      // Update state
      setState(prev => ({
        restaurants: prev.restaurants.map(r => r.slug === slug ? data : r),
        selectedRestaurant: data,
        loading: false,
        error: null
      }));
      
      return data;
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
      return null;
    }
  }, []);

  const selectRestaurantById = useCallback(async (id) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      // Always fetch fresh data for individual restaurant
      const response = await fetch(`/api/restaurants?id=${id}&t=${Date.now()}`);
      if (!response.ok) throw new Error('Restaurant not found');
      
      const data = await response.json();
      if (!data) throw new Error('Invalid restaurant data');

      // Update state
      setState(prev => ({
        restaurants: prev.restaurants.map(r => r._id === id ? data : r),
        selectedRestaurant: data,
        loading: false,
        error: null
      }));
      
      return data;
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
      return null;
    }
  }, []);

  // Method to refresh restaurants after rating changes
  const refreshRestaurants = useCallback(() => {
    return fetchRestaurants(true);
  }, [fetchRestaurants]);

  const value = {
    restaurants: state.restaurants,
    selectedRestaurant: state.selectedRestaurant,
    loading: state.loading,
    error: state.error,
    fetchRestaurantBySlug,
    selectRestaurantById,
    refreshRestaurants,
    setSelectedRestaurant: (restaurant) => setState(prev => ({
      ...prev,
      selectedRestaurant: restaurant
    }))
  };

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error("useRestaurant must be used within a RestaurantProvider");
  }
  return context;
}