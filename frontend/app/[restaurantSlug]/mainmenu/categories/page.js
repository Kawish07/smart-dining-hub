"use client";

import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { useParams } from "next/navigation";
import { useRestaurant } from "@/context/RestaurantContext";
import Link from "next/link";
import Image from "next/image";
import { 
  Utensils, ChefHat, AlertCircle, Loader2, Coffee, 
  Salad, Pizza, Beer, IceCream, Cookie, ArrowRight, 
  RefreshCw, Home, Flame, Info, Menu, Bookmark, 
  Leaf, Clock, TrendingUp, Sparkles, Crown, Eye
} from "lucide-react";

// Memoized Category Card Component
const CategoryCard = memo(({ 
  category, 
  restaurantSlug, 
  isHovered, 
  onHover, 
  iconConfig,
  index 
}) => {
  return (
    <Link
      href={`/${restaurantSlug}/foods/${encodeURIComponent(category.name)}`}
      className="group block"
      onMouseEnter={() => onHover(category._id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className={`relative bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 overflow-hidden transition-all duration-500 hover:shadow-emerald-200/50 hover:-translate-y-3 hover:bg-white h-full ${isHovered ? 'ring-2 ring-emerald-400/30' : ''}`}>
        
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 transition-all duration-700 ${isHovered ? 'scale-150 opacity-20' : 'scale-100'}`} 
               style={{ background: `linear-gradient(135deg, ${iconConfig.color}, ${iconConfig.colorSecondary})` }}></div>
          <div className={`absolute -bottom-8 -left-8 w-24 h-24 rounded-full opacity-5 transition-all duration-500 ${isHovered ? 'scale-125' : 'scale-100'}`}
               style={{ background: `linear-gradient(45deg, ${iconConfig.color}, ${iconConfig.colorSecondary})` }}></div>
        </div>

        {/* Top Accent Line with Animation */}
        <div className={`h-1.5 bg-gradient-to-r transition-all duration-500 ${isHovered ? 'h-3' : ''}`}
             style={{ background: `linear-gradient(90deg, ${iconConfig.color}, ${iconConfig.colorSecondary})` }}></div>
        
        <div className="relative p-8 pb-6">
          {/* Icon with Floating Animation */}
          <div className={`relative mb-6 transition-all duration-500 ${isHovered ? 'scale-110 -rotate-3' : 'scale-100'}`}>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl relative overflow-hidden`}
                 style={{ background: `linear-gradient(135deg, ${iconConfig.color}, ${iconConfig.colorSecondary})` }}>
              <iconConfig.icon className="w-8 h-8 text-white" strokeWidth={1.5} />
              
              {/* Shimmer Effect */}
              <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ${isHovered ? 'translate-x-full' : '-translate-x-full'}`}></div>
            </div>
            
            {/* Floating Sparkle */}
            {isHovered && (
              <Sparkles className="w-4 h-4 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
            )}
          </div>

          {/* Category Name with Gradient Text */}
          <h3 className={`text-2xl font-bold mb-4 transition-all duration-300 bg-gradient-to-r ${iconConfig.textGradient} bg-clip-text text-transparent`}>
            {category.name}
          </h3>

          {/* Item Count with Modern Design */}
          <div className="flex items-center mb-6 gap-3">
            <div className="flex items-center bg-emerald-50 rounded-full px-3 py-2">
              <TrendingUp className="w-4 h-4 mr-2 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">
                {category.itemCount
                  ? `${category.itemCount} ${category.itemCount === 1 ? 'item' : 'items'}`
                  : 'Curated'}
              </span>
            </div>
            
            {/* Popular Badge */}
            {index < 3 && (
              <div className="flex items-center bg-gradient-to-r from-amber-400 to-orange-500 rounded-full px-3 py-1">
                <Crown className="w-3 h-3 mr-1 text-white" />
                <span className="text-xs font-bold text-white">Popular</span>
              </div>
            )}
          </div>

          {/* Modern CTA Button */}
          <div className={`relative overflow-hidden rounded-2xl transition-all duration-500 ${isHovered ? 'shadow-lg' : 'shadow-md'}`}>
            <div className={`absolute inset-0 transition-all duration-300`}
                 style={{ background: `linear-gradient(135deg, ${iconConfig.color}, ${iconConfig.colorSecondary})` }}></div>
            
            {/* Hover Overlay */}
            <div className={`absolute inset-0 bg-white/20 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}></div>
            
            <div className="relative px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span className="font-semibold">Explore Menu</span>
              </div>
              <ArrowRight className={`w-5 h-5 transition-transform duration-300 ${isHovered ? 'translate-x-2 scale-110' : ''}`} />
            </div>
          </div>
        </div>

        {/* Bottom Glow Effect */}
        <div className={`absolute bottom-0 left-0 right-0 h-px transition-all duration-500 ${isHovered ? 'shadow-lg' : ''}`}
             style={{ background: `linear-gradient(90deg, transparent, ${iconConfig.color}, transparent)` }}></div>
      </div>
    </Link>
  );
});
CategoryCard.displayName = 'CategoryCard';

// Main Component
export default function CategoriesPage() {
  const params = useParams();
  const { selectedRestaurant, fetchRestaurantBySlug, loading: restaurantLoading } = useRestaurant();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);

  // Enhanced category icons with modern color scheme
  const categoryIcons = useMemo(() => ({
    "appetizers": { 
      icon: Salad, 
      color: "#10b981", 
      colorSecondary: "#059669",
      textGradient: "from-emerald-600 to-emerald-800"
    },
    "starters": { 
      icon: Salad, 
      color: "#10b981", 
      colorSecondary: "#059669",
      textGradient: "from-emerald-600 to-emerald-800"
    },
    "main course": { 
      icon: Utensils, 
      color: "#0d9488", 
      colorSecondary: "#0f766e",
      textGradient: "from-teal-600 to-teal-800"
    },
    "entrees": { 
      icon: Utensils, 
      color: "#0d9488", 
      colorSecondary: "#0f766e",
      textGradient: "from-teal-600 to-teal-800"
    },
    "desserts": { 
      icon: IceCream, 
      color: "#f59e0b", 
      colorSecondary: "#d97706",
      textGradient: "from-amber-600 to-amber-800"
    },
    "beverages": { 
      icon: Coffee, 
      color: "#8b5cf6", 
      colorSecondary: "#7c3aed",
      textGradient: "from-violet-600 to-violet-800"
    },
    "fast-food": { 
      icon: Pizza, 
      color: "#ef4444", 
      colorSecondary: "#dc2626",
      textGradient: "from-red-600 to-red-800"
    },
    "pasta": { 
      icon: Utensils, 
      color: "#f59e0b", 
      colorSecondary: "#d97706",
      textGradient: "from-amber-600 to-amber-800"
    },
    "cocktails": { 
      icon: Beer, 
      color: "#ec4899", 
      colorSecondary: "#db2777",
      textGradient: "from-pink-600 to-pink-800"
    },
    "pastries": { 
      icon: Cookie, 
      color: "#f97316", 
      colorSecondary: "#ea580c",
      textGradient: "from-orange-600 to-orange-800"
    },
  }), []);

  // Optimized data fetching
  const fetchCategoriesData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let restaurant = selectedRestaurant;
      if (!restaurant && params.restaurantSlug) {
        restaurant = await fetchRestaurantBySlug(params.restaurantSlug);
      }

      if (!restaurant) throw new Error("Restaurant not found");

      const response = await fetch(`/api/categories?restaurantId=${restaurant._id}`);
      if (!response.ok) throw new Error('Failed to load menu categories');

      const data = await response.json();
      
      // Simple sorting - remove complex logic if not needed
      const sortedData = [...data].sort((a, b) => a.name.localeCompare(b.name));
      setCategories(sortedData);
    } catch (err) {
      console.error("Categories loading error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [params.restaurantSlug, selectedRestaurant, fetchRestaurantBySlug]);

  useEffect(() => {
    fetchCategoriesData();
  }, [fetchCategoriesData]);

  // Modern Loading state
  if (restaurantLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 p-1 shadow-2xl animate-pulse">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
            </div>
          </div>
          <div className="absolute -inset-4 rounded-full bg-emerald-200/20 animate-ping"></div>
        </div>
      </div>
    );
  }

  // Enhanced Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-white/90 backdrop-blur-md rounded-3xl p-10 shadow-2xl border border-red-100">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-red-800 mb-3">Menu Unavailable</h3>
          <p className="text-red-600 mb-8 leading-relaxed">{error}</p>
          <button
            onClick={fetchCategoriesData}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <RefreshCw className="w-5 h-5 mr-3" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Enhanced Main content
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {/* Enhanced Header */}
        <div className="pt-16 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 mb-8 shadow-lg">
              <ChefHat className="w-6 h-6 text-emerald-600" />
              <span className="text-emerald-700 font-semibold">Menu Categories</span>
            </div>
            
            <h1 className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-700 to-cyan-800 mb-6 leading-tight">
              {selectedRestaurant?.name || 'Discover Flavors'}
            </h1>
            
            {selectedRestaurant?.description && (
              <p className="text-xl text-emerald-700/80 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
                {selectedRestaurant.description}
              </p>
            )}
          </div>
        </div>

        {/* Enhanced Categories Grid */}
        <div className="px-4 sm:px-6 lg:px-8 pb-16">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {categories.map((category, index) => {
                const iconConfig = categoryIcons[category.name.toLowerCase()] || 
                  { 
                    icon: Utensils, 
                    color: "#10b981", 
                    colorSecondary: "#059669",
                    textGradient: "from-emerald-600 to-emerald-800"
                  };
                
                return (
                  <CategoryCard
                    key={category._id}
                    category={category}
                    restaurantSlug={params.restaurantSlug}
                    isHovered={hoveredCategory === category._id}
                    onHover={setHoveredCategory}
                    iconConfig={iconConfig}
                    index={index}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}