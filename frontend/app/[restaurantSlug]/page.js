"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import MainBody from "@/components/Mainbody";
import { useRestaurant } from "@/context/RestaurantContext";
import Chatbot from "@/components/Chatbot";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Star, Clock, MapPin, ChevronRight } from "lucide-react";

export default function Home() {
  const { setSelectedRestaurant } = useRestaurant();
  const { selectedRestaurant } = useRestaurant();
  const [restaurants, setRestaurants] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [floatingElements, setFloatingElements] = useState([]);
  const [visibleRestaurants, setVisibleRestaurants] = useState([]);
  const [isHovering, setIsHovering] = useState(null);
  const heroRef = useRef(null);
  const exploreRef = useRef(null);

  // Parallax scroll effect
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.2]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 250]);
  const textY = useTransform(scrollYProgress, [0, 0.5], [0, -100]);

  useEffect(() => {
    const elements = Array.from({ length: 8 }, (_, index) => ({
      id: `element-${index}`,
      initialX: `${(index * 12) % 95}%`,
      initialY: `${(index * 10) % 90}%`,
      initialScale: 0.4 + (index % 6) / 10,
      animateX: [
        `${(index * 12) % 95}%`,
        `${((index * 12) + 20) % 95}%`,
        `${(index * 12) % 95}%`
      ],
      animateY: [
        `${(index * 10) % 90}%`,
        `${((index * 10) + 15) % 90}%`,
        `${(index * 10) % 90}%`
      ],
      rotation: [0, index % 2 === 0 ? 15 : -15, 0],
      duration: 50 + (index * 8),
      delay: index * 0.5,
      type: ['plate', 'fork', 'spoon', 'chef-hat', 'wine-glass'][index % 5]
    }));

    setFloatingElements(elements);
  }, []);

  useEffect(() => {
    const fetchRestaurants = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/restaurants", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to fetch restaurants");
        const data = await response.json();
        setRestaurants(data);

        const filtered = activeFilter === "All"
          ? data
          : data.filter(restaurant =>
            restaurant.cuisineType === activeFilter
          );
        setVisibleRestaurants(filtered);
      } catch (error) {
        console.error("Error fetching restaurants:", error);
        setError("Failed to load restaurants. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchRestaurants();

    document.documentElement.style.scrollBehavior = "smooth";

    return () => {
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  useEffect(() => {
    if (restaurants.length > 0) {
      const filtered = activeFilter === "All"
        ? restaurants
        : restaurants.filter(restaurant =>
          restaurant.cuisineType === activeFilter
        );

      setVisibleRestaurants([]);
      setTimeout(() => {
        setVisibleRestaurants(filtered);
      }, 300);
    }
  }, [activeFilter, restaurants]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 70, damping: 15 }
    },
    exit: {
      y: 30,
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  const cuisineTypes = ["All", ...new Set(restaurants.map(r => r.cuisineType))];

  const handleCardHover = (id) => {
    setIsHovering(id);
  };

  const getPriceRange = (priceLevel) => {
    const ranges = ["$", "$$", "$$$", "$$$$"];
    return ranges[priceLevel - 1] || "$$";
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={`star-${i}`}
            size={16}
            className={
              i < fullStars || (i === fullStars && hasHalfStar)
                ? "text-amber-400 fill-amber-400"
                : "text-gray-300"
            }
          />
        ))}
      </div>
    );
  };

  return (
    <MainBody>
      <div className="relative bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 min-h-screen overflow-hidden">
        <div className="absolute w-full h-full overflow-hidden z-0 pointer-events-none">
          {floatingElements.map((item) => (
            <motion.div
              key={item.id}
              className="absolute opacity-10"
              initial={{
                x: item.initialX,
                y: item.initialY,
                scale: item.initialScale,
                opacity: 0
              }}
              animate={{
                x: item.animateX,
                y: item.animateY,
                rotate: item.rotation,
                opacity: 0.15
              }}
              transition={{
                duration: item.duration,
                repeat: Infinity,
                repeatType: "reverse",
                delay: item.delay,
                ease: "easeInOut"
              }}
            >
              <div className="w-16 h-16 text-teal-800">
                {getFoodIcon(item.type)}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
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
          ></motion.div>

          <motion.div
            className="absolute inset-0 bg-[url('/hero-food-image.jpg')] bg-cover bg-center"
            style={{
              scale: heroScale,
              y: heroY
            }}
          ></motion.div>

          <motion.div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4 text-center"
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
              className="text-6xl md:text-8xl font-black text-white mb-6 tracking-tighter relative overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2 }}
            >
              <span className="block">Discover</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-400 to-cyan-300 relative">
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
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.8 }}
            >
              <a
                href="#explore"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 text-white rounded-full font-medium shadow-lg hover:shadow-xl transform transition-all duration-300 hover:-translate-y-1 hover:scale-105 group backdrop-blur-sm"
              >
                Browse Our Collection
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </a>
            </motion.div>
          </motion.div>
        </motion.div>

        <div className="curved-transition">
          <svg viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path
              fill="#FFFFFF"
              fillOpacity="1"
              d="M0,192L48,176C96,160,192,128,288,133.3C384,139,480,181,576,186.7C672,192,768,160,864,149.3C960,139,1056,149,1152,165.3C1248,181,1344,203,1392,213.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ></path>
          </svg>
        </div>

        <div
          id="explore"
          ref={exploreRef}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10 bg-white"
        >
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-teal-100 to-emerald-100 text-teal-800 text-sm font-medium mb-4">
              EXCEPTIONAL DINING
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
              Explore Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">Handpicked Venues</span>
            </h2>
            <div className="h-1 w-24 bg-gradient-to-r from-teal-400 to-emerald-500 mx-auto mb-6 rounded-full"></div>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Each restaurant in our curated selection promises a unique journey of flavors, ambiance, and memorable moments.
            </p>

            <div className="flex flex-wrap justify-center gap-3 mt-10">
              {cuisineTypes.map((type) => (
                <button
                  key={`filter-${type}`}
                  onClick={() => setActiveFilter(type)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeFilter === type
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

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

          {isLoading ? (
            <div className="flex flex-col justify-center items-center py-20">
              <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-teal-500"></div>
              <p className="mt-6 text-teal-600">
                Curating exceptional dining experiences...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {visibleRestaurants.map((restaurant) => (
                <motion.div
                  key={`restaurant-${restaurant._id}`}
                  className="restaurant-card group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ 
                    scale: 1.02,
                    transition: { duration: 0.2 }
                  }}
                >
                  <Link
                    href={`/${restaurant.slug}/mainmenu`}
                    onClick={() => setSelectedRestaurant(restaurant)}
                    className="block h-full"
                  >
                    <div className="bg-white rounded-2xl overflow-hidden shadow-lg h-full transition-all duration-300 group-hover:shadow-2xl border border-gray-100 md:flex">
                      <div className="relative md:w-2/5 overflow-hidden">
                        <div className="aspect-video md:h-full w-full">
                          <Image
                            src={restaurant.image}
                            alt={restaurant.name}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            priority
                          />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-tr from-black/70 via-black/40 to-transparent opacity-60 group-hover:opacity-50 transition-opacity duration-300"></div>
                        
                        <div className="absolute top-4 left-4 flex space-x-2">
                          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-teal-800 text-xs font-bold rounded-full shadow-md">
                            {getPriceRange(restaurant.priceLevel)}
                          </span>
                          <span className="px-3 py-1 bg-amber-400/90 backdrop-blur-sm text-white text-xs font-bold rounded-full shadow-md">
                            {restaurant.isFeatured ? "Featured" : "Popular"}
                          </span>
                        </div>
                        
                        <div className="absolute bottom-0 left-0 right-0 p-4 md:hidden">
                          <h3 className="text-xl font-bold text-white group-hover:text-teal-300 transition-colors duration-300">
                            {restaurant.name}
                          </h3>
                        </div>
                      </div>

                      <div className="p-6 md:w-3/5 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-xl font-bold text-gray-900 hidden md:block">
                              {restaurant.name}
                            </h3>
                            <div className="flex items-center bg-gray-50 px-2 py-1 rounded">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={`star-${i}`}
                                    size={16}
                                    className={
                                      i < Math.floor(restaurant.rating?.average || 0)
                                        ? "text-amber-400 fill-amber-400"
                                        : "text-gray-300"
                                    }
                                  />
                                ))}
                              </div>
                              <span className="ml-2 text-sm font-medium">
                                {restaurant.rating?.average || 0}
                              </span>
                              <span className="ml-1 text-xs text-gray-500">
                                ({restaurant.rating?.count || 0})
                              </span>
                            </div>
                          </div>

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
                          
                          <p className="text-gray-600 text-sm mb-6 line-clamp-2">
                            Experience the authentic flavors of {restaurant.cuisineType} cuisine in an elegant atmosphere designed to delight all your senses.
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                              </svg>
                            </div>
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
              ))}
            </div>
          )}

          <div className="mt-24 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-30">
              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <pattern id="smallGrid" width="8" height="8" patternUnits="userSpaceOnUse">
                    <path d="M 8 0 L 0 0 0 8" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-teal-600/20" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#smallGrid)" />
              </svg>
            </div>
            
            <div className="relative z-10">
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Ready for a Memorable Dining Experience?
              </h3>
              <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-8">
                Reserve your table today and embark on a culinary journey that will tantalize your senses and create lasting memories.
              </p>
              <Link href={`/dawat-restaurant/reservation`}><button className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 text-white rounded-full font-medium shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 group">
                Reserve a Table
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </button>
              </Link>
            </div>
          </div>
        </div>
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
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </MainBody>
  );
}

function getFoodIcon(type) {
  switch (type) {
    case 'plate':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
      );
    case 'fork':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
          <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" />
        </svg>
      );
    case 'spoon':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
          <path d="M3.5 2c-.28 0-.5.22-.5.5v3c0 .28.22.5.5.5H4v1H3.5c-1.65 0-3 1.35-3 3v3c0 1.65 1.35 3 3 3H4v1.5c0 .28.22.5.5.5s.5-.22.5-.5V16h.5c1.65 0 3-1.35 3-3v-3c0-1.65-1.35-3-3-3H5V6h.5c.28 0 .5-.22.5-.5v-3c0-.28-.22-.5-.5-.5h-2z" />
        </svg>
      );
    case 'chef-hat':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
          <path d="M12 2C9.01 2 6.28 3.08 4.17 4.88c-.35.3-.44.8-.15 1.15.3.35.8.44 1.15.15C7.45 4.59 9.66 3.7 12 3.7c2.34 0 4.55.89 6.28 2.48.35.3.85.2 1.15-.15.3-.35.2-.85-.15-1.15C17.72 3.08 14.99 2 12 2zm7.5 6h-15C3.67 8 3 8.67 3 9.5v.5h1v8c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8h1v-.5c0-.83-.67-1.5-1.5-1.5z" />
        </svg>
      );
    case 'wine-glass':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
          <path d="M18 6h-2V4h2v2zm-2 4V8h2v2h-2zm-2-2V6h2v2h-2zm-2 0h2v2h-2V8zm0 0V6h2v2h-2zm8-4v12c0 2.21-1.79 4-4 4H6c-2.21 0-4-1.79-4-4V4c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2zm-2 0H4v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4z" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
        </svg>
      );
  }
}