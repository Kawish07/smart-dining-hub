"use client";
import { useRestaurant } from "@/context/RestaurantContext";
import Link from "next/link";
import { useState, useEffect, useMemo, memo, useCallback } from "react";
import { 
  Book, ScrollText, MapPin, Timer, ShoppingBag, 
  Utensils, ChefHat, Star, ArrowRight, Coffee, 
  Leaf, GripHorizontal 
} from "lucide-react";
import Image from "next/image";

// Static color styles - moved outside component to prevent recreation
const COLOR_STYLES = {
  teal: {
    gradient: "from-teal-500 to-teal-700",
    text: "text-teal-800",
    border: "border-teal-500",
    ring: "ring-teal-500/20",
    light: "bg-teal-50",
    medium: "bg-teal-500",
    dark: "bg-teal-700"
  },
  green: {
    gradient: "from-green-500 to-emerald-600",
    text: "text-green-800",
    border: "border-green-500",
    ring: "ring-green-500/20",
    light: "bg-green-50",
    medium: "bg-green-500",
    dark: "bg-green-700"
  },
  emerald: {
    gradient: "from-emerald-500 to-teal-600",
    text: "text-emerald-800",
    border: "border-emerald-500",
    ring: "ring-emerald-500/20",
    light: "bg-emerald-50",
    medium: "bg-emerald-500",
    dark: "bg-emerald-700"
  }
};

// Optimized Menu Card Component
const MenuCard = memo(({ item, colorStyles }) => {
  const IconComponent = item.icon;
  
  return (
    <Link href={item.href} passHref>
      <div className={`
        relative h-full rounded-2xl overflow-hidden shadow-lg
        transition-all duration-300 hover:shadow-xl
        border border-gray-100 bg-white/80 backdrop-blur-sm
        ${colorStyles.ring} ring-1
      `}>
        {/* Top Accent Bar */}
        <div className={`
          absolute top-0 left-0 w-full h-1
          bg-gradient-to-r ${colorStyles.gradient}
        `}></div>
        
        {/* Card Content */}
        <div className="p-6 flex flex-col h-full">
          {/* Icon */}
          <div className={`
            mb-5 w-14 h-14 rounded-xl
            ${colorStyles.light}
            flex items-center justify-center
            transition-transform duration-300 hover:scale-110
            shadow-md
          `}>
            <IconComponent size={28} className={colorStyles.text} strokeWidth={1.5} />
          </div>
          
          {/* Content */}
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            {item.title}
          </h3>
          
          <p className="text-gray-600 text-sm mb-5 flex-grow">
            {item.description}
          </p>
          
          {/* Button */}
          <div className={`
            mt-auto inline-flex items-center 
            text-sm font-medium ${colorStyles.text} 
            transition-transform duration-300 hover:translate-x-1
          `}>
            <span>Explore Now</span>
            <ArrowRight className="ml-2 w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
});
MenuCard.displayName = 'MenuCard';

// Optimized Hero Section
const HeroSection = memo(({ selectedRestaurant }) => (
  <div className="relative h-[500px] sm:h-[550px] overflow-hidden">
    <div className="relative w-full h-full">
      <Image
        src={selectedRestaurant.image || '/images/default-restaurant.jpg'}
        alt={selectedRestaurant.name}
        fill
        className="object-cover"
        priority
        sizes="100vw"
        quality={85}
      />
    </div>
    
    <div className="absolute inset-0 bg-gradient-to-r from-teal-900/80 to-green-900/60" />
    
    <div className="relative h-full flex flex-col justify-center px-6 sm:px-12 max-w-7xl mx-auto">
      <div 
        className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight"
      >
        <span className="block">Welcome to</span>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-green-300">
          {selectedRestaurant.name}
        </span>
      </div>
      
      <p 
        className="text-lg text-gray-100 max-w-2xl mb-8"
      >
        {selectedRestaurant.description || 'Indulge in extraordinary flavors from locally-sourced ingredients.'}
      </p>
      
      <div>
        <Link href={`/${selectedRestaurant.path}/mainmenu/categories`} passHref>
          <button className="px-6 py-3 rounded-full bg-gradient-to-r from-teal-500 to-green-600 text-white font-medium hover:shadow-lg transition-shadow">
            Explore Our Menu
          </button>
        </Link>
      </div>
    </div>
  </div>
));
HeroSection.displayName = 'HeroSection';

// Optimized Featured Section
const FeaturedSection = memo(({ selectedRestaurant }) => (
  <div className="mt-16 bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-teal-100">
    <div className="flex flex-col md:flex-row items-center">
      <div className="md:w-1/2 mb-6 md:mb-0 md:pr-8">
        <h3 className="text-2xl font-bold text-teal-800 mb-4">
          Today's Special
        </h3>
        <p className="text-gray-600 mb-6">
          Our executive chef has prepared an exquisite seasonal tasting menu featuring fresh, locally-sourced ingredients.
        </p>
        <Link href={`/${selectedRestaurant.path}/special`} passHref>
          <button className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-teal-600 to-green-600 text-white font-medium">
            View Tasting Menu
          </button>
        </Link>
      </div>
      <div className="md:w-1/2">
        <div className="relative h-64 rounded-xl overflow-hidden">
        </div>
      </div>
    </div>
  </div>
));
FeaturedSection.displayName = 'FeaturedSection';

// Main Component
export default function MainMenuPage() {
  const { selectedRestaurant } = useRestaurant();
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Throttled scroll detection for better performance
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 50);
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Memoized menu items - exact same links as original
  const menuItems = useMemo(() => [
    {
      title: "Browse Menu",
      description: "Explore our chef-crafted culinary creations",
      href: `/${selectedRestaurant?.path}/mainmenu/categories`,
      icon: Utensils,
      color: "teal"
    },
    {
      title: "Track Order",
      description: "Follow your order's journey in real-time",
      href: `/${selectedRestaurant?.path}/tracking`,
      icon: Timer,
      color: "green"
    },
    {
      title: "Make Reservation",
      description: "Secure your perfect dining experience",
      href: `/${selectedRestaurant?.path}/reservation`,
      icon: Book,
      color: "emerald"
    }
  ], [selectedRestaurant?.path]);

  // Memoized color styles getter
  const getColorStyles = useCallback((color) => {
    return COLOR_STYLES[color] || COLOR_STYLES.teal;
  }, []);

  if (!selectedRestaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-100 to-green-200">
        <div className="text-center text-teal-800 text-xl font-semibold bg-white p-6 rounded-xl shadow-lg">
          <p>No restaurant selected. Please select a restaurant first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-green-50">
      {/* Add CSS for fade-in animation */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
          opacity: 0;
        }
      `}</style>
      
      {/* Hero Section */}
      <HeroSection selectedRestaurant={selectedRestaurant} />

      {/* Main Content */}
      <div className="px-6 py-12 sm:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-teal-800 mb-4">
            What would you like to experience today?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our thoughtfully crafted options designed to enhance your dining journey.
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {menuItems.map((item, index) => (
            <div
              key={item.title}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <MenuCard 
                item={item} 
                colorStyles={getColorStyles(item.color)} 
              />
            </div>
          ))}
        </div>
        
        {/* Featured Section */}
        <FeaturedSection selectedRestaurant={selectedRestaurant} />
      </div>
    </div>
  );
}