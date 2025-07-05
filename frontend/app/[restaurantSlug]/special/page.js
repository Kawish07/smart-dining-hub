"use client";
import { useRestaurant } from "@/context/RestaurantContext";
import { useSpecialDishesContext } from "@/context/SpecialDishesContext";
import Link from "next/link";
import { useState, useEffect } from "react";
import { 
  ChefHat, Clock, ArrowLeft, Star, Flame, Leaf, AlertCircle 
} from "lucide-react";
import { motion } from "framer-motion";

export default function SpecialMenuPage() {
  const { selectedRestaurant } = useRestaurant();
  const { specialDishes, setSpecialDishes } = useSpecialDishesContext();
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (selectedRestaurant?._id) {
      fetchSpecialDishes(selectedRestaurant._id);
    }
  }, [selectedRestaurant, refreshKey]);

  const fetchSpecialDishes = async (restaurantId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/specials?restaurantId=${restaurantId}`);
      if (!response.ok) throw new Error("Failed to load special dishes");
      const data = await response.json();
      setSpecialDishes(data);
    } catch (err) {
      console.error("Error fetching special dishes:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshSpecials = () => setRefreshKey(prev => prev + 1);

  if (!selectedRestaurant && isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-100 to-red-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center text-red-500 text-xl font-semibold bg-white p-6 rounded-xl shadow-lg"
        >
          <p>No restaurant selected. Please select a restaurant first.</p>
        </motion.div>
      </div>
    );
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 80, damping: 15 }
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF7] relative">
      {/* Background decorative elements */}
      <div className="absolute top-40 right-10 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-10 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl"></div>
      
      {/* Hero Header */}
      <div className="relative h-72 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center" 
          style={{ 
            backgroundImage: `url(${selectedRestaurant?.image || '/images/chef-special-bg.jpg'})`,
            filter: 'brightness(0.6)'
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/30" />
        
        {/* Content */}
        <div className="relative h-full flex flex-col justify-center px-6 sm:px-12 lg:px-16 max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-2"
          >
            <Link href={`/${selectedRestaurant?.path}/mainmenu`} className="inline-flex items-center text-amber-300 hover:text-amber-200 transition-colors">
              <ArrowLeft size={16} className="mr-1" />
              <span className="text-sm">Back to Main Menu</span>
            </Link>
          </motion.div>
          
          <motion.div 
            className="flex items-center space-x-3 mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="h-10 w-10 rounded-full bg-amber-600 flex items-center justify-center">
              <ChefHat className="h-5 w-5 text-white" />
            </div>
            <div className="h-px w-8 bg-amber-400"></div>
            <p className="text-amber-300 font-medium tracking-wider uppercase text-sm">
              Limited Time Offer
            </p>
          </motion.div>
          
          <motion.h1 
            className="text-4xl sm:text-5xl font-black text-white leading-tight"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Chef's <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-500">Specials</span>
          </motion.h1>
          
          <motion.p 
            className="text-gray-300 mt-3 max-w-2xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Exquisite culinary creations crafted with passion and creativity by our executive chef,
            featuring seasonal ingredients and unique flavor combinations.
          </motion.p>
        </div>
        
        {/* Bottom Wavy Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100">
            <path 
              fill="#FFFBF7" 
              fillOpacity="1" 
              d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,58.7C672,64,768,96,864,96C960,96,1056,64,1152,48C1248,32,1344,32,1392,32L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ></path>
          </svg>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="px-6 pt-12 pb-24 sm:px-12 lg:px-16 max-w-7xl mx-auto">
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-pulse flex flex-col items-center">
              <ChefHat size={40} className="text-amber-300 mb-4" />
              <p className="text-amber-600">Preparing something special...</p>
            </div>
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <div className="flex">
              <AlertCircle className="text-red-500 mr-3" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}
        
        {/* No Specials State */}
        {!loading && !error && specialDishes.length === 0 && (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <ChefHat size={48} className="text-amber-300 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">Coming Soon</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Our chef is currently crafting new special dishes. 
              Please check back later for exciting culinary creations.
            </p>
          </motion.div>
        )}
        
        {/* Special Dishes Grid */}
        {!loading && !error && specialDishes.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {specialDishes.map((dish) => (
              <motion.div
                key={dish._id}
                variants={itemVariants}
                className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 border border-amber-100"
              >
                {/* Dish Image */}
                <div className="h-56 overflow-hidden relative">
                  <img 
                    src={dish.image || '/images/default-dish.jpg'} 
                    alt={dish.name}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                    onError={(e) => {
                      e.target.src = '/images/default-dish.jpg';
                    }}
                  />
                  {dish.featured && (
                    <div className="absolute top-4 right-4 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center">
                      <Flame className="w-3 h-3 mr-1" />
                      Featured
                    </div>
                  )}
                </div>
                
                {/* Dish Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {dish.name}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {dish.description}
                  </p>
                  
                  {/* Dish Ingredients */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Ingredients:</p>
                    <div className="flex flex-wrap gap-1">
                      {dish.ingredients && dish.ingredients.map((ingredient, idx) => (
                        <span 
                          key={idx}
                          className="inline-flex items-center px-2 py-1 bg-amber-50 text-amber-700 rounded-full text-xs"
                        >
                          <Leaf className="w-3 h-3 mr-1" />
                          {ingredient}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Price and Details */}
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                    <div className="text-amber-600 font-bold text-xl">
                      ${parseFloat(dish.price).toFixed(2)}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-gray-400 mr-1" />
                      <span className="text-gray-500 text-sm">Limited Time</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
        
        {/* Bottom CTA */}
        {!loading && !error && specialDishes.length > 0 && (
          <motion.div 
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <Link href={`/${selectedRestaurant?.path}/reservation`} passHref>
              <button className="px-8 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium shadow-lg hover:shadow-amber-200/50 transition-all duration-300 transform hover:-translate-y-1">
                Reserve a Table to Try Our Specials
              </button>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}