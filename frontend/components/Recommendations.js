import { useState, useEffect } from 'react';
import { useParams } from "next/navigation";
import { useRestaurant } from "@/context/RestaurantContext";
import { useCart } from "@/context/CartContext";
import { useSession } from "next-auth/react";
import { 
  Flame, 
  Loader2, 
  RefreshCcw, 
  AlertCircle, 
  ShoppingCart, 
  Clock, 
  MapPin, 
  TrendingUp,
  Star,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Configuration options
const SORT_OPTIONS = [
  { value: 'popularity', label: 'Most Popular' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name', label: 'Name A-Z' }
];

export default function ProfessionalRecommendations({
  title = "Popular Picks",
  subtitle = "Currently trending in your area",
  maxItems = 10,
  showFilters = true,
  showSearch = true,
  showRatings = true,
  showCategories = true,
  autoRefresh = false,
  refreshInterval = 300000, // 5 minutes
  theme = 'teal'
}) {
  const [recommendations, setRecommendations] = useState([]);
  const params = useParams();
  const category = params?.category;
  const restaurantSlug = params?.restaurantSlug;

  const { selectedRestaurant, fetchRestaurantBySlug, loading: restaurantLoading } = useRestaurant();
  const { addToCart } = useCart();
  const { data: session } = useSession();
  const [filteredRecommendations, setFilteredRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  const [sortBy, setSortBy] = useState('popularity');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [scrollPosition, setScrollPosition] = useState(0);

  // Get theme colors
  const getThemeColors = (theme) => {
    const themes = {
      teal: {
        primary: 'teal',
        secondary: 'emerald',
        gradient: 'from-teal-500 to-emerald-500',
        lightGradient: 'from-teal-50 to-emerald-50',
        text: 'from-teal-600 to-emerald-600'
      },
      blue: {
        primary: 'blue',
        secondary: 'indigo',
        gradient: 'from-blue-500 to-indigo-500',
        lightGradient: 'from-blue-50 to-indigo-50',
        text: 'from-blue-600 to-indigo-600'
      },
      purple: {
        primary: 'purple',
        secondary: 'pink',
        gradient: 'from-purple-500 to-pink-500',
        lightGradient: 'from-purple-50 to-pink-50',
        text: 'from-purple-600 to-pink-600'
      }
    };
    return themes[theme] || themes.teal;
  };

  const themeColors = getThemeColors(theme);

  // Get unique categories and ensure each has a unique key
  const categories = ['all', ...new Set(recommendations
    .map(item => item.category)
    .filter(category => category && category.trim() !== '') // Filter out empty/null categories
  )];

  const fetchRecommendations = async () => {
    try {
      setRefreshing(true);
      setError(null);
      console.log("Fetching recommendations...");
      
      const res = await fetch('/api/recommendations', {
        next: { revalidate: 3600 } // Cache for 1 hour
      });
      
      console.log("API response status:", res.status);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("API response data:", data);
      
      if (!data.success) {
        throw new Error(data.error || 'Invalid response format');
      }
      
      // Ensure each recommendation has a unique _id
      const recommendationsWithIds = (data.recommendations || []).map((item, index) => ({
        ...item,
        _id: item._id || `item-${index}-${Date.now()}` // Fallback unique ID
      }));
      
      setRecommendations(recommendationsWithIds);
    } catch (err) {
      console.error("Fetch error details:", {
        message: err.message,
        stack: err.stack
      });
      setError(err.message);
      // Show error using alert instead of toast
      alert(`Failed to load popular items: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  // Filter and sort recommendations
  useEffect(() => {
    let filtered = [...recommendations];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.restaurantName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (a.price || 0) - (b.price || 0);
        case 'price-high':
          return (b.price || 0) - (a.price || 0);
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'popularity':
        default:
          const aOrders = parseInt((a.reason || '0').split(' ')[0]) || 0;
          const bOrders = parseInt((b.reason || '0').split(' ')[0]) || 0;
          return bOrders - aOrders;
      }
    });

    // Limit items
    filtered = filtered.slice(0, maxItems);

    setFilteredRecommendations(filtered);
  }, [recommendations, searchTerm, selectedCategory, sortBy, maxItems]);

  // Auto refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchRecommendations, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const handleAddToCart = (item) => {
    if (!session) {
      alert("Please log in to add items to cart.");
      return;
    }
    addToCart({ ...item, quantity: 1 });
  };

  const scrollContainer = (direction) => {
    const container = document.getElementById('recommendations-container');
    if (container) {
      const scrollAmount = 300;
      const newPosition = direction === 'left' 
        ? Math.max(0, scrollPosition - scrollAmount)
        : scrollPosition + scrollAmount;
      
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  const HorizontalCard = ({ item, index }) => (
    <div 
      className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border border-gray-100 flex-shrink-0 w-80"
      onMouseEnter={() => setActiveIndex(index)}
      onMouseLeave={() => setActiveIndex(null)}
    >
      {/* Trending Badge */}
      <div className="relative bg-gradient-to-r from-orange-50 to-red-50 pt-16 pb-4">
        <div className={`bg-gradient-to-r ${themeColors.gradient} text-white text-xs font-bold px-3 py-2 rounded-full flex items-center gap-2 absolute top-4 left-4 shadow-lg z-10`}>
          <Flame size={14} className="animate-pulse" />
          <span>Ordered {item.reason || 'recently'}</span>
        </div>
        {item.isVeg && (
          <div className="absolute top-4 right-4 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        )}
      </div>
      
      <div className="p-6 pt-4 space-y-4">
        <div className="min-h-[60px]">
          <h3 className={`font-bold text-xl text-gray-800 group-hover:text-${themeColors.primary}-600 transition-colors duration-300 mb-2 leading-tight`}>
            {item.name || 'Unnamed Item'}
          </h3>
          {showCategories && item.category && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {item.category}
            </span>
          )}
        </div>
        
        {showRatings && item.rating && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star size={16} className="fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-gray-700">{item.rating}</span>
            </div>
            {item.reviews && (
              <span className="text-sm text-gray-500">({item.reviews.toLocaleString()})</span>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <span className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${themeColors.text}`}>
            Rs {item.price?.toLocaleString() || '0'}
          </span>
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
            <Clock size={14} />
            <span>{item.prepTime || '20-30'} min</span>
          </div>
        </div>
        
        <div className={`flex items-center gap-2 text-sm text-gray-600 bg-${themeColors.primary}-50 px-3 py-2 rounded-lg`}>
          <MapPin size={16} className={`text-${themeColors.primary}-500 flex-shrink-0`} />
          <span className="truncate font-medium">{item.restaurantName || 'Unknown Restaurant'}</span>
        </div>
        
        <button
          onClick={() => handleAddToCart(item)}
          className={`
            w-full py-4 rounded-xl font-semibold text-white
            transition-all duration-300 transform
            flex items-center justify-center gap-3
            ${activeIndex === index 
              ? `bg-gradient-to-r ${themeColors.gradient} shadow-xl scale-105` 
              : `bg-gradient-to-r ${themeColors.gradient} opacity-90 shadow-lg hover:shadow-xl hover:scale-105 hover:opacity-100`
            }
            group/button
          `}
        >
          <ShoppingCart 
            className="group-hover/button:animate-bounce transition-transform duration-300" 
            size={20} 
          />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center p-12 min-h-40 gap-4 bg-gradient-to-br ${themeColors.lightGradient} rounded-2xl`}>
        <Loader2 className={`animate-spin h-12 w-12 text-${themeColors.primary}-500`} />
        <p className={`text-${themeColors.primary}-600 font-semibold text-lg animate-pulse`}>
          Discovering tasty recommendations...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-8 text-center border border-red-100 shadow-xl">
        <div className="rounded-full bg-red-100 w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="text-red-500" size={32} />
        </div>
        <h4 className="font-bold text-red-800 text-2xl mb-3">Unable to Load Recommendations</h4>
        <p className="text-red-700 mb-8 max-w-md mx-auto leading-relaxed">{error}</p>
        <button
          onClick={fetchRecommendations}
          className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 shadow-lg hover:shadow-xl flex items-center gap-3 mx-auto transition-all duration-300 transform hover:scale-105"
        >
          <RefreshCcw className="h-5 w-5" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className={`inline-flex items-center gap-3 bg-gradient-to-r ${themeColors.gradient} text-white px-4 py-2 rounded-full shadow-lg mb-4`}>
              <TrendingUp className="h-5 w-5" />
              <span className="font-semibold">Trending Now</span>
            </div>
            <h2 className={`text-3xl lg:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${themeColors.text} mb-2`}>
              {title}
            </h2>
            <p className="text-gray-600 text-lg">{subtitle}</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Refresh Button */}
            <button 
              onClick={fetchRecommendations}
              disabled={refreshing}
              className={`flex items-center gap-3 px-6 py-3 text-${themeColors.primary}-600 hover:text-white bg-white hover:bg-gradient-to-r hover:${themeColors.gradient} border-2 border-${themeColors.primary}-200 hover:border-transparent rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105`}
            >
              {refreshing ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <RefreshCcw className="h-5 w-5" />
              )}
              <span className="font-semibold">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Filters and Controls */}
        {(showFilters || showSearch) && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* Search */}
                {showSearch && (
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search dishes or restaurants..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                )}
                
                {/* Category Filter */}
                {showFilters && (
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                  >
                    {categories.map((category, index) => (
                      <option key={`category-${category}-${index}`} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              <div className="flex gap-4 items-center">
                {/* Sort Options */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={`sort-${option.value}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
        
        {/* Results */}
        <div className="space-y-6">
          {filteredRecommendations.length === 0 ? (
            <div className={`bg-gradient-to-br ${themeColors.lightGradient} rounded-2xl p-8 text-center border border-${themeColors.primary}-100 shadow-xl`}>
              <div className={`rounded-full bg-${themeColors.primary}-100 w-20 h-20 flex items-center justify-center mx-auto mb-6`}>
                <Search className={`text-${themeColors.primary}-500`} size={32} />
              </div>
              <h4 className={`font-bold text-${themeColors.primary}-800 text-2xl mb-3`}>No Items Found</h4>
              <p className={`text-${themeColors.primary}-700 mb-8 max-w-md mx-auto leading-relaxed`}>
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            <>
              {/* Results Count and Navigation */}
              <div className="flex justify-between items-center">
                <p className="text-gray-600">
                  Showing {filteredRecommendations.length} of {recommendations.length} items
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => scrollContainer('left')}
                    className={`p-2 rounded-lg bg-${themeColors.primary}-100 text-${themeColors.primary}-600 hover:bg-${themeColors.primary}-200 transition-colors duration-200`}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => scrollContainer('right')}
                    className={`p-2 rounded-lg bg-${themeColors.primary}-100 text-${themeColors.primary}-600 hover:bg-${themeColors.primary}-200 transition-colors duration-200`}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
              
              {/* Horizontal Scrolling Container */}
              <div className="relative">
                <div 
                  id="recommendations-container"
                  className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {filteredRecommendations.map((item, index) => (
                    <HorizontalCard key={item._id} item={item} index={index} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}