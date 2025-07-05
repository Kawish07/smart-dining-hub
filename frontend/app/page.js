"use client";
import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import MainBody from "@/components/Mainbody";
import { useRestaurant } from "@/context/RestaurantContext";
import Chatbot from "@/components/Chatbot";
import Image from "next/image";
import { Star, Clock, MapPin, ChevronRight } from "lucide-react";

// Optimized Restaurant Card Component with better memoization
const RestaurantCard = memo(({ restaurant, onSelect }) => {
  const priceRange = useMemo(() => {
    const ranges = ["$", "$$", "$$$", "$$$$"];
    return ranges[restaurant.priceLevel - 1] || "$$";
  }, [restaurant.priceLevel]);

  const handleClick = useCallback(() => {
    onSelect(restaurant);
  }, [restaurant, onSelect]);

  const rating = restaurant.rating?.average || 0;
  const ratingCount = restaurant.rating?.count || 0;

  return (
    <motion.div
      className="restaurant-card group relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      <Link
        href={`/${restaurant.slug}/mainmenu`}
        onClick={handleClick}
        className="block h-full"
      >
        <div className="bg-white rounded-2xl overflow-hidden shadow-lg h-full transition-all duration-300 group-hover:shadow-2xl border border-gray-100 md:flex">
          {/* Image Section - Fixed position for Image fill */}
          <div className="relative md:w-2/5 overflow-hidden">
            <div className="aspect-video md:h-full w-full relative">
              <Image
                src={restaurant.image}
                alt={restaurant.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                loading="lazy"
              />
            </div>
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/70 via-black/40 to-transparent opacity-60 group-hover:opacity-50 transition-opacity duration-300" />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex space-x-2">
              <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-teal-800 text-xs font-bold rounded-full shadow-md">
                {priceRange}
              </span>
              <span className="px-3 py-1 bg-amber-400/90 backdrop-blur-sm text-white text-xs font-bold rounded-full shadow-md">
                {restaurant.isFeatured ? "Featured" : "Popular"}
              </span>
            </div>

            {/* Mobile Title */}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:hidden">
              <h3 className="text-xl font-bold text-white group-hover:text-teal-300 transition-colors duration-300">
                {restaurant.name}
              </h3>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6 md:w-3/5 flex flex-col justify-between">
            <div>
              {/* Title and Rating */}
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-gray-900 hidden md:block">
                  {restaurant.name}
                </h3>
                <div className="flex items-center bg-gray-50 px-2 py-1 rounded">
                  <StarRating rating={rating} />
                  <span className="ml-2 text-sm font-medium">{rating}</span>
                  <span className="ml-1 text-xs text-gray-500">({ratingCount})</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                  {restaurant.cuisineType}
                </span>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  <Clock size={14} className="mr-1" />
                  <span>{restaurant.deliveryTime} min</span>
                </div>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  <MapPin size={14} className="mr-1" />
                  <span>2.5 mi</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-600 text-sm mb-6 line-clamp-2">
                Experience the authentic flavors of {restaurant.cuisineType} cuisine in an elegant atmosphere designed to delight all your senses.
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <CheckIcon />
                <span className="text-xs text-gray-500">Free delivery</span>
              </div>
              <span className="inline-flex items-center text-teal-600 font-medium text-sm group-hover:text-teal-700 transition-colors">
                View Menu
                <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
});

RestaurantCard.displayName = 'RestaurantCard';

// Optimized StarRating component
const StarRating = memo(({ rating }) => {
  const stars = useMemo(() => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={`star-${i}`}
        size={16}
        className={
          i < Math.floor(rating)
            ? "text-amber-400 fill-amber-400"
            : "text-gray-300"
        }
      />
    ));
  }, [rating]);

  return <div className="flex">{stars}</div>;
});

StarRating.displayName = 'StarRating';

// Optimized CheckIcon component
const CheckIcon = memo(() => (
  <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center">
    <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  </div>
));

CheckIcon.displayName = 'CheckIcon';

// Optimized Hero Section
const HeroSection = memo(({ heroRef, heroOpacity, heroScale, heroY, textY }) => (
  <motion.section
    ref={heroRef}
    className="relative h-screen flex items-center justify-center overflow-hidden"
    style={{ opacity: heroOpacity }}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 1.2 }}
  >
    <motion.div
      className="absolute inset-0 bg-black/70 z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.8 }}
    />
    
    <motion.div
      className="absolute inset-0 bg-[url('/hero-food-image.jpg')] bg-cover bg-center"
      style={{ scale: heroScale, y: heroY }}
    />

    <motion.div
      className="relative z-20 flex flex-col items-center justify-center px-4 text-center"
      style={{ y: textY }}
    >
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.3 }}
        className="mb-6"
      >
        <span className="inline-block px-5 py-2 rounded-full bg-gradient-to-r from-teal-500/90 to-emerald-500/90 text-white text-sm font-medium mb-8 shadow-lg backdrop-blur-sm">
          CULINARY EXCELLENCE
        </span>
      </motion.div>

      <motion.h1
        className="text-6xl md:text-8xl font-black text-white mb-6 tracking-tighter"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      >
        <span className="block">Discover</span>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-400 to-cyan-300">
          Gastronomic Bliss
        </span>
      </motion.h1>

      <motion.p
        className="text-xl md:text-2xl text-gray-200 max-w-2xl mb-12 font-light"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
      >
        Immerse yourself in exceptional dining experiences crafted for connoisseurs of refined taste.
      </motion.p>

      <motion.div
        className="relative"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
      >
        <a
          href="#explore"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 text-white rounded-full font-medium shadow-lg hover:shadow-xl transform transition-all duration-300 hover:-translate-y-1 hover:scale-105 group backdrop-blur-sm"
        >
          Browse Our Collection
          <ArrowIcon />
        </a>
      </motion.div>
    </motion.div>
  </motion.section>
));

HeroSection.displayName = 'HeroSection';

// Optimized Arrow Icon
const ArrowIcon = memo(() => (
  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
));

ArrowIcon.displayName = 'ArrowIcon';

// Optimized Filter Button
const FilterButton = memo(({ type, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
      isActive
        ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
  >
    {type}
  </button>
));

FilterButton.displayName = 'FilterButton';

export default function Home() {
  const { setSelectedRestaurant } = useRestaurant();
  const [restaurants, setRestaurants] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const heroRef = useRef(null);

  // Parallax scroll effect
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.2]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 250]);
  const textY = useTransform(scrollYProgress, [0, 0.5], [0, -100]);

  // Optimized cuisine types with better memoization
  const cuisineTypes = useMemo(() => {
    if (restaurants.length === 0) return ["All"];
    return ["All", ...new Set(restaurants.map(r => r.cuisineType))];
  }, [restaurants]);

  // Optimized visible restaurants
  const visibleRestaurants = useMemo(() => {
    if (activeFilter === "All") return restaurants;
    return restaurants.filter(restaurant => restaurant.cuisineType === activeFilter);
  }, [activeFilter, restaurants]);

  // Optimized fetch function
  const fetchRestaurants = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/restaurants");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRestaurants(data);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      setError("Failed to load restaurants. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Optimized filter handler
  const handleFilterChange = useCallback((type) => {
    setActiveFilter(type);
  }, []);

  // Optimized select handler
  const handleRestaurantSelect = useCallback((restaurant) => {
    setSelectedRestaurant(restaurant);
  }, [setSelectedRestaurant]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  return (
    <MainBody>
      <div className="relative bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 min-h-screen overflow-hidden">
        <HeroSection
          heroRef={heroRef}
          heroOpacity={heroOpacity}
          heroScale={heroScale}
          heroY={heroY}
          textY={textY}
        />

        {/* Curved Transition */}
        <div className="curved-transition">
          <svg viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path
              fill="#FFFFFF"
              fillOpacity="1"
              d="M0,192L48,176C96,160,192,128,288,133.3C384,139,480,181,576,186.7C672,192,768,160,864,149.3C960,139,1056,149,1152,165.3C1248,181,1344,203,1392,213.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
          </svg>
        </div>

        {/* Main Content */}
        <section id="explore" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10 bg-white">
          {/* Header */}
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-teal-100 to-emerald-100 text-teal-800 text-sm font-medium mb-4">
              EXCEPTIONAL DINING
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
              Explore Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">Handpicked Venues</span>
            </h2>
            <div className="h-1 w-24 bg-gradient-to-r from-teal-400 to-emerald-500 mx-auto mb-6 rounded-full" />
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Each restaurant in our curated selection promises a unique journey of flavors, ambiance, and memorable moments.
            </p>

            {/* Filters */}
            <div className="flex flex-wrap justify-center gap-3 mt-10">
              {cuisineTypes.map((type) => (
                <FilterButton
                  key={`filter-${type}`}
                  type={type}
                  isActive={activeFilter === type}
                  onClick={() => handleFilterChange(type)}
                />
              ))}
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-md">
              <div className="flex items-center">
                <svg className="h-6 w-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Content */}
          {isLoading ? (
            <div className="flex flex-col justify-center items-center py-20">
              <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-teal-500" />
              <p className="mt-6 text-teal-600">
                Curating exceptional dining experiences...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {visibleRestaurants.map((restaurant) => (
                <RestaurantCard
                  key={`restaurant-${restaurant._id}`}
                  restaurant={restaurant}
                  onSelect={handleRestaurantSelect}
                />
              ))}
            </div>
          )}

          {/* CTA Section */}
          <div className="mt-24 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Ready for a Memorable Dining Experience?
              </h3>
              <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-8">
                Reserve your table today and embark on a culinary journey that will tantalize your senses and create lasting memories.
              </p>
              <Link href="/dawat-restaurant/reservation">
                <button className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 text-white rounded-full font-medium shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 group">
                  Reserve a Table
                  <ArrowIcon />
                </button>
              </Link>
            </div>
          </div>
        </section>
      </div>

      <Chatbot />

      <style jsx global>{`
        .curved-transition {
          position: relative;
          height: 15vh;
          width: 100%;
          margin-top: -15vh;
          z-index: 5;
        }
        
        .restaurant-card {
          perspective: 1000px;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </MainBody>
  );
}