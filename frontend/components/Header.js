"use client";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useState, useEffect } from "react";
import CartAside from "./CartAside";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useRestaurant } from "@/context/RestaurantContext";
import { motion } from "framer-motion";

export default function Header() {
  const { data: session, status } = useSession();
  const { cart } = useCart();
  const [isCartOpen, setCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { selectedRestaurant, setSelectedRestaurant } = useRestaurant();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/auth/login");
  };

  const getCartItemCount = () => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  };

  const handleHomeClick = () => {
    if (selectedRestaurant) {
      router.push(`/${selectedRestaurant.path}/mainmenu`);
    } else {
      router.push("/");
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className={`${
      scrolled 
        ? "bg-gradient-to-r from-emerald-900 via-teal-800 to-cyan-900 shadow-2xl py-3 backdrop-blur-md" 
        : "bg-gradient-to-r from-emerald-800 via-teal-700 to-cyan-800 py-5"
      } text-white sticky top-0 z-50 transition-all duration-500 border-b border-emerald-600/30`}
    >
      <nav className="flex justify-between items-center max-w-7xl mx-auto px-4 lg:px-8">
        {/* Enhanced Logo with Animation */}
        <motion.div 
          onClick={handleHomeClick} 
          className="cursor-pointer flex items-center space-x-4 group"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
            <div className="relative bg-gradient-to-r from-emerald-500 to-teal-500 p-3 rounded-full shadow-lg group-hover:shadow-xl transition-all duration-300">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-8 w-8 text-white drop-shadow-sm" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2.5} 
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" 
                />
              </svg>
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full animate-pulse shadow-lg"></div>
          </div>
          
          <div className="flex flex-col relative">
            <motion.h1 
              className="text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-200 via-teal-200 to-cyan-200 group-hover:from-emerald-100 group-hover:via-teal-100 group-hover:to-cyan-100 transition-all duration-300 drop-shadow-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
            Smart Dining Hub
            </motion.h1>
            <motion.span 
              className="text-sm text-emerald-300/90 font-medium tracking-wide hidden md:inline-block"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              ✨ Extraordinary Dining Experiences ✨
            </motion.span>
          </div>
        </motion.div>

        {/* Mobile Menu Toggle with Enhanced Design */}
        <div className="md:hidden">
          <motion.button 
            onClick={toggleMenu} 
            className="text-white focus:outline-none p-2 rounded-xl bg-gradient-to-r from-teal-600/60 to-emerald-600/60 hover:from-teal-600/90 hover:to-emerald-600/90 transition-all duration-300 shadow-lg backdrop-blur-sm border border-teal-400/20"
            aria-label="Toggle menu"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.svg 
              className="w-7 h-7" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
              animate={{ rotate: isMenuOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2.5" 
                d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}
              ></path>
            </motion.svg>
          </motion.button>
        </div>

        {/* Enhanced Desktop Navigation */}
        <motion.ul 
          className="hidden md:flex space-x-8 items-center"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {/* Authentication & Dashboard Links */}
          {session ? (
            <>
              <motion.li whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link 
                  href="/auth/dashboard" 
                  className="relative text-emerald-100 hover:text-white transition-all duration-300 text-lg font-semibold group px-4 py-2 rounded-lg hover:bg-white/10 backdrop-blur-sm"
                >
                  <span className="flex items-center space-x-2">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                      />
                    </svg>
                    <span>Dashboard</span>
                  </span>
                  <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-emerald-300 to-teal-300 group-hover:w-full transition-all duration-300"></span>
                </Link>
              </motion.li>
              <motion.button
                className="bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-rose-600 hover:via-rose-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold flex items-center space-x-2 border border-rose-400/20"
                onClick={handleLogout}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                  />
                </svg>
                <span>Logout</span>
              </motion.button>
            </>
          ) : (
             (
              <motion.li whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/auth/login"
                  className="bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:via-teal-700 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold flex items-center space-x-2 border border-emerald-400/20"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" 
                    />
                  </svg>
                  <span>Login</span>
                </Link>
              </motion.li>
            )
          )}

          {/* Enhanced Cart Icon */}
          <motion.li 
            className="relative cursor-pointer" 
            onClick={() => setCartOpen(!isCartOpen)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full blur-md opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
              <div className="relative p-3 rounded-full bg-gradient-to-r from-amber-500/80 to-orange-600/80 hover:from-amber-500 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm border border-amber-400/30">
                <svg
                  className="w-7 h-7 text-white drop-shadow-sm"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              {cart.length > 0 && (
                <motion.span 
                  className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg border-2 border-white"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  {getCartItemCount()}
                </motion.span>
              )}
            </div>
          </motion.li>
        </motion.ul>
      </nav>

      {/* Enhanced Mobile Menu Dropdown */}
      <motion.div 
        className={`md:hidden bg-gradient-to-r from-teal-900/95 via-emerald-900/95 to-cyan-900/95 backdrop-blur-lg border-t border-emerald-600/30 ${isMenuOpen ? 'block' : 'hidden'}`}
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: isMenuOpen ? 'auto' : 0, opacity: isMenuOpen ? 1 : 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        <div className="p-6 shadow-inner">
          <ul className="flex flex-col space-y-6">
            <motion.li
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: isMenuOpen ? 1 : 0, x: isMenuOpen ? 0 : -20 }}
              transition={{ delay: 0.1 }}
            >
              <Link 
                href="/" 
                className="text-emerald-100 hover:text-white transition-colors duration-300 flex items-center py-3 px-4 rounded-lg hover:bg-white/10 group"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="p-2 bg-emerald-600/30 rounded-lg mr-4 group-hover:bg-emerald-600/50 transition-colors">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-6 w-6" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
                    />
                  </svg>
                </div>
                <span className="text-lg font-semibold">Home</span>
              </Link>
            </motion.li>

            {session ? (
              <>
                <motion.li
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: isMenuOpen ? 1 : 0, x: isMenuOpen ? 0 : -20 }}
                  transition={{ delay: 0.2 }}
                >
                  <Link 
                    href="/auth/dashboard" 
                    className="text-emerald-100 hover:text-white transition-colors duration-300 flex items-center py-3 px-4 rounded-lg hover:bg-white/10 group"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="p-2 bg-teal-600/30 rounded-lg mr-4 group-hover:bg-teal-600/50 transition-colors">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-6 w-6" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                        />
                      </svg>
                    </div>
                    <span className="text-lg font-semibold">Dashboard</span>
                  </Link>
                </motion.li>
                <motion.li
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: isMenuOpen ? 1 : 0, x: isMenuOpen ? 0 : -20 }}
                  transition={{ delay: 0.3 }}
                >
                  <button
                    className="flex items-center text-rose-300 hover:text-rose-200 py-3 px-4 rounded-lg transition-colors duration-300 hover:bg-rose-500/10 group w-full text-left"
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                  >
                    <div className="p-2 bg-rose-600/30 rounded-lg mr-4 group-hover:bg-rose-600/50 transition-colors">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-6 w-6" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                        />
                      </svg>
                    </div>
                    <span className="text-lg font-semibold">Logout</span>
                  </button>
                </motion.li>
              </>
            ) : (
              pathname !== "/" && (
                <motion.li
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: isMenuOpen ? 1 : 0, x: isMenuOpen ? 0 : -20 }}
                  transition={{ delay: 0.2 }}
                >
                  <Link
                    href="/auth/login"
                    className="flex items-center text-emerald-300 hover:text-emerald-200 py-3 px-4 rounded-lg transition-colors duration-300 hover:bg-emerald-500/10 group"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="p-2 bg-emerald-600/30 rounded-lg mr-4 group-hover:bg-emerald-600/50 transition-colors">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-6 w-6" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" 
                        />
                      </svg>
                    </div>
                    <span className="text-lg font-semibold">Login</span>
                  </Link>
                </motion.li>
              )
            )}

            {/* Mobile Cart Link */}
            <motion.li 
              className="flex items-center text-amber-300 hover:text-amber-200 transition-colors duration-300 py-3 px-4 rounded-lg hover:bg-amber-500/10 group cursor-pointer"
              onClick={() => {
                setCartOpen(!isCartOpen);
                setIsMenuOpen(false);
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: isMenuOpen ? 1 : 0, x: isMenuOpen ? 0 : -20 }}
              transition={{ delay: 0.4 }}
            >
              <div className="p-2 bg-amber-600/30 rounded-lg mr-4 group-hover:bg-amber-600/50 transition-colors">
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <span className="text-lg font-semibold">Cart</span>
              {cart.length > 0 && (
                <span className="ml-auto bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                  {getCartItemCount()}
                </span>
              )}
            </motion.li>
          </ul>
        </div>
      </motion.div>

      {/* Cart Aside (Drawer) */}
      {isCartOpen && <CartAside setCartOpen={setCartOpen} />}
    </header>
  );
}