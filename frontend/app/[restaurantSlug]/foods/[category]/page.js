// app/[restaurantSlug]/mainmenu/categories/[category]/page.js
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRestaurant } from "@/context/RestaurantContext";
import { useCart } from "@/context/CartContext";
import { useSession } from "next-auth/react";
import {
  ShoppingCart,
  Loader2,
  Info,
  Flame,
  Star,
  AlertCircle,
  Utensils,
  ArrowLeft,
  ChefHat,
  Clock,
  Heart,
  Leaf,
  Check
} from "lucide-react";
import Link from "next/link";

const RatingStars = ({ rating, size = 16, showNumber = true }) => {
  const roundedRating = Math.round(rating);
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={
            star <= roundedRating
              ? "text-amber-400 fill-amber-400"
              : "text-gray-300"
          }
        />
      ))}
      {showNumber && (
        <span className="ml-1 text-sm text-gray-600">
          {rating?.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default function CategoryPage() {
  const params = useParams();
  const category = params?.category;
  const restaurantSlug = params?.restaurantSlug;

  const { selectedRestaurant, fetchRestaurantBySlug, loading: restaurantLoading } = useRestaurant();
  const { addToCart } = useCart();
  const { data: session } = useSession();

  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddedToCart, setShowAddedToCart] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [favoriteItems, setFavoriteItems] = useState(new Set());

  const fetchFoodItems = async () => {
  try {
    const timestamp = Date.now();
    setLoading(true);
    setError(null);

    let restaurant = selectedRestaurant;
    if (!restaurant && restaurantSlug) {
      restaurant = await fetchRestaurantBySlug(restaurantSlug);
    }

    if (!restaurant) throw new Error("Restaurant data not available");

    const decodedCategory = decodeURIComponent(category);

    const params = new URLSearchParams({
      restaurantId: restaurant._id,
      category: decodedCategory
    });

    if (session?.user?.email) {
      params.append('userId', session.user.email);
    }

    // First try ratings endpoint
    let itemsData = [];
    try {
      const ratingsResponse = await fetch(`/api/items/ratings?${params.toString()}&t=${timestamp}`, {
        cache: 'no-store'
      });
      
      if (ratingsResponse.ok) {
        itemsData = await ratingsResponse.json();
      } else {
        throw new Error(`Ratings API failed: ${ratingsResponse.status}`);
      }
    } catch (ratingsError) {
      console.warn('Failed to fetch from ratings endpoint:', ratingsError);
      
      // Fallback to basic items endpoint
      try {
        const itemsResponse = await fetch(`/api/items?${params.toString()}&t=${timestamp}`, {
          cache: 'no-store'
        });
        
        if (itemsResponse.ok) {
          itemsData = await itemsResponse.json();
          // Add default ratings if using fallback
          itemsData = itemsData.map(item => ({
            ...item,
            averageRating: 0,
            totalReviews: 0,
            userRating: 0
          }));
        } else {
          throw new Error(`Items API failed: ${itemsResponse.status}`);
        }
      } catch (itemsError) {
        console.error('Failed to fetch from items endpoint:', itemsError);
        throw itemsError;
      }
    }

    // Ensure we have an array with ratings
    if (!Array.isArray(itemsData)) {
      throw new Error("Invalid data format received");
    }

    setFoodItems(itemsData);
  } catch (err) {
    console.error('Error fetching foods:', err);
    setError(err.message);
    setFoodItems([]);
  } finally {
    setLoading(false);
    setLoadingProgress(100);
  }
};

  useEffect(() => {
    if (category) {
      fetchFoodItems();
    }
  }, [restaurantSlug, category, selectedRestaurant, session?.user?.email]);

  // Add this useEffect hook to your component
  useEffect(() => {
    const handleRefreshRatings = () => {
      fetchFoodItems();
    };

    // Listen for custom events when reviews are submitted
    window.addEventListener('refreshRatings', handleRefreshRatings);

    return () => {
      window.removeEventListener('refreshRatings', handleRefreshRatings);
    };
  }, []);

  const handleAddToCart = (item) => {
    if (!session?.user) {
      alert("Please log in to add items to the cart.");
      return;
    }

    if (!selectedRestaurant) {
      alert("Restaurant information is missing. Please try again.");
      return;
    }

    addToCart(
      {
        ...item,
        quantity: 1,
        _id: item._id || crypto.randomUUID()
      },
      {
        id: selectedRestaurant._id.toString(),
        name: selectedRestaurant.name.trim(),
        slug: selectedRestaurant.slug.trim()
      }
    );
    setShowAddedToCart(item._id);
    setTimeout(() => setShowAddedToCart(null), 2000);
  };

  const toggleFavorite = (itemId) => {
    setFavoriteItems(prevFavorites => {
      const newFavorites = new Set(prevFavorites);
      if (newFavorites.has(itemId)) {
        newFavorites.delete(itemId);
      } else {
        newFavorites.add(itemId);
      }
      return newFavorites;
    });
  };

  const decodedCategory = decodeURIComponent(category);

  // Loading state with progress indicator
  if (restaurantLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-teal-50 to-emerald-50">
        <div className="rounded-full bg-gradient-to-r from-teal-400 to-emerald-500 p-4 shadow-lg">
          <Loader2 className="h-12 w-12 animate-spin text-white" />
        </div>
        <p className="mt-6 text-teal-800 text-lg font-medium">Preparing delicious {decodedCategory}...</p>
        <div className="mt-6 w-64 h-3 bg-teal-100 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 transition-all duration-300 ease-out"
            style={{ width: `${loadingProgress}%` }}
          ></div>
        </div>
      </div>
    );
  }

  // Error state with retry button
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-teal-50 to-emerald-50">
        <div className="rounded-full bg-red-100 p-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <h3 className="text-xl font-semibold mt-4 text-gray-800">Menu Unavailable</h3>
        <p className="text-gray-600 mt-2 text-center">{error}</p>
        <button
          onClick={() => {
            fetchFoodItems();
          }}
          className="mt-6 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-lg shadow-lg hover:shadow-xl transition transform hover:scale-105 flex items-center"
        >
          <Loader2 className="mr-2 h-5 w-5" />
          Try Again
        </button>
      </div>
    );
  }

  // Empty food items state
  if (!Array.isArray(foodItems) || foodItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-teal-50 to-emerald-50">
        <div className="rounded-full bg-teal-100 p-4">
          <Utensils className="h-12 w-12 text-teal-600" />
        </div>
        <h3 className="text-xl font-semibold mt-4 text-teal-800">
          No items available in {decodedCategory}
        </h3>
        <p className="text-teal-600 mt-2 text-center">
          This category is currently being updated with fresh offerings.
        </p>
        <Link
          href={`/${restaurantSlug}/mainmenu/categories`}
          className="mt-6 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-lg shadow-lg hover:shadow-xl transition transform hover:scale-105 flex items-center"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to Categories
        </Link>
      </div>
    );
  }
  const RatingStars = ({ rating, size = 16, showNumber = true }) => {
    // Convert to number if needed
    const numericRating = typeof rating === 'string' ? parseFloat(rating) : rating;
    const roundedRating = Math.round(numericRating);

    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={
              star <= roundedRating
                ? "text-amber-400 fill-amber-400"
                : "text-gray-300"
            }
          />
        ))}
        {showNumber && (
          <span className="ml-1 text-sm text-gray-600">
            {numericRating?.toFixed(1)}
          </span>
        )}
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-emerald-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-64 overflow-hidden z-0 opacity-10">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-teal-400 rounded-full"></div>
        <div className="absolute top-20 left-1/4 w-24 h-24 bg-emerald-500 rounded-full"></div>
        <div className="absolute top-10 right-1/3 w-32 h-32 bg-green-400 rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header section */}
        <div className="text-center mb-16 relative">
          <div className="relative inline-block mb-2">
            <div className="absolute -top-6 -left-6 transform -rotate-45">
              <Leaf className="h-10 w-10 text-emerald-300" />
            </div>
            <div className="absolute -top-6 -right-6 transform rotate-45">
              <Leaf className="h-10 w-10 text-teal-300" />
            </div>

            <div className="inline-block p-5 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-3xl shadow-2xl transform hover:scale-102 transition-transform duration-300 border-4 border-white">
              <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl flex items-center justify-center px-8 py-3">
                <span className="mr-4 text-teal-100 bg-teal-800 p-2 rounded-full">
                  <ChefHat className="h-10 w-10" />
                </span>
                <span>
                  {decodedCategory.charAt(0).toUpperCase() + decodedCategory.slice(1)}
                </span>
              </h1>
            </div>
          </div>

          <div className="inline-block mt-6 bg-white/40 backdrop-blur-sm px-8 py-3 rounded-full shadow-lg">
            <p className="text-xl text-teal-800 font-medium flex items-center justify-center">
              <span className="mr-3 text-emerald-600">
                <Info className="h-6 w-6" />
              </span>
              Discover Our Culinary Delights
            </p>
          </div>

          <div className="mt-4">
            <Link
              href={`/${restaurantSlug}/mainmenu/categories`}
              className="inline-flex items-center px-4 py-2 rounded-full bg-white/70 text-teal-700 border border-teal-200 shadow hover:bg-white transition-all duration-300"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span>Back to Categories</span>
            </Link>
          </div>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {foodItems.map((item, index) => (
            <div
              key={item._id}
              className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg border border-teal-100 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl group relative animate-fadeIn"
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'both'
              }}
            >
              <button
                onClick={() => toggleFavorite(item._id)}
                className="absolute top-3 right-3 z-20 bg-white/80 p-2 rounded-full shadow-md transition-all duration-300 hover:scale-110"
              >
                <Heart
                  className={`h-5 w-5 ${favoriteItems.has(item._id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                />
              </button>

              <div className="h-2 bg-gradient-to-r from-teal-500 to-emerald-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMnB4IiB2aWV3Qm94PSIwIDAgMTI4MCAxNDAiIHByZXNlcnZlQXNwZWN0UmF0aW89Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0iI2ZmZmZmZjIwIj48cGF0aCBkPSJNMTI4MCAwTDY0MCA3MEwwIDB2MTQwbDY0MC03MCAxMjgwIDcwVjB6Ii8+PC9nPjwvc3ZnPg==')]"></div>
              </div>

              {item.image && (
                <div className="relative overflow-hidden h-56">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-30 group-hover:opacity-60 transition-opacity duration-300" />

                  <button
                    onClick={() => handleAddToCart(item)}
                    className="absolute bottom-3 right-3 bg-teal-500 hover:bg-teal-600 text-white p-2 rounded-full shadow-lg transform translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300"
                  >
                    <ShoppingCart className="h-5 w-5" />
                  </button>
                </div>
              )}

              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-2xl font-bold text-teal-800 group-hover:text-teal-600 transition-colors">
                    {item.name}
                  </h2>
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                    Rs{item.price.toFixed(2)}
                  </span>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-2">{item.description}</p>

                <div className="flex flex-col gap-3 mb-4">
                  {/* Rating section */}
                  <div className="flex items-center justify-between">
                    {item.averageRating > 0 ? (
                      <div className="flex items-center">
                        <RatingStars rating={item.averageRating} size={16} />
                        <span className="ml-1 text-xs text-gray-500">
                          ({item.totalReviews} {item.totalReviews === 1 ? 'review' : 'reviews'})
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">No ratings yet</span>
                    )}

                    <span className="flex items-center text-gray-500 text-sm">
                      <Clock className="h-4 w-4 mr-1" />
                      {10 + Math.floor(Math.random() * 20)} mins
                    </span>
                  </div>

                  {/* User's rating - FIXED to show properly */}
                  {item.userRating > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">Your rating:</span>
                      <RatingStars rating={item.userRating} size={14} showNumber={false} />
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleAddToCart(item)}
                  className={`w-full py-3 rounded-lg transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg ${showAddedToCart === item._id
                    ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white"
                    : "bg-gradient-to-r from-teal-500 to-emerald-600 text-white"
                    }`}
                >
                  {showAddedToCart === item._id ? (
                    <>
                      <Check className="mr-2 animate-bounce" size={20} />
                      Added to Cart!
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2" size={20} />
                      Add to Cart
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: translateY(30px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        .animate-fadeIn {
          opacity: 0;
          animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        .scale-102 {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
}