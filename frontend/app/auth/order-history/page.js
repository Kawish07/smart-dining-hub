import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { History, ChevronLeft, Loader2, AlertCircle, Star, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import ReviewForm from "./ReviewForm";

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [itemRatings, setItemRatings] = useState({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    const fetchOrderHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/orders/history?userId=${encodeURIComponent(user?.email || '')}`,
          { cache: "no-store" }
        );

        if (!response.ok) throw new Error("Failed to fetch orders");

        const data = await response.json();

        // Process and normalize order data
        const processedOrders = (data.orders || []).map(order => {
          // Ensure restaurant data is properly structured
          if (!order.restaurantId && order.restaurant && order.restaurant._id) {
            return {
              ...order,
              restaurantId: order.restaurant._id,
              restaurantName: order.restaurantName || order.restaurant.name || "Unknown Restaurant",
              restaurantSlug: order.restaurantSlug || order.restaurant.slug || "unknown"
            };
          }

          // If restaurantId exists but other fields are missing
          if (order.restaurantId && (!order.restaurantName || !order.restaurantSlug)) {
            return {
              ...order,
              restaurantName: order.restaurantName || "Restaurant",
              restaurantSlug: order.restaurantSlug || "restaurant"
            };
          }

          return order;
        }).filter(order => order.restaurantId); // Only include orders with a restaurantId

        setOrders(processedOrders);

        // Fetch item ratings for all items in all orders
        const allItemIds = processedOrders.flatMap(order =>
          order.items?.map(item => item._id) || []
        );
        
        if (allItemIds.length > 0) {
          // Create a helper function to fetch ratings
          const fetchRatings = async (ids) => {
            try {
              const response = await fetch(
                `/api/items/ratings?itemIds=${ids.join(',')}`
              );
              if (response.ok) {
                return await response.json();
              }
              return {};
            } catch (error) {
              console.error("Error fetching ratings:", error);
              return {};
            }
          };

          // Fetch ratings in chunks to avoid URL length limits
          const chunkSize = 50;
          let ratingsMap = {};
          
          for (let i = 0; i < allItemIds.length; i += chunkSize) {
            const chunk = allItemIds.slice(i, i + chunkSize);
            const chunkRatings = await fetchRatings(chunk);
            ratingsMap = { ...ratingsMap, ...chunkRatings };
          }
          
          setItemRatings(ratingsMap);
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
        toast.error("Failed to load order history");
      } finally {
        setLoading(false);
      }
    };

    if (user?.email) {
      fetchOrderHistory();
    }
  }, [user, authLoading, router]);

  const handleOpenReviewForm = (order) => {
    if (!order.restaurantId) {
      toast.error("Cannot review this order - missing restaurant information");
      return;
    }

    setCurrentOrder(order);
    setShowReviewForm(true);
  };

  const handleReviewSubmitSuccess = (updatedOrder) => {
    // Update the specific order in state
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order._id === updatedOrder._id ? updatedOrder : order
      )
    );
    
    // Refetch item ratings to ensure averages are up-to-date
    const itemIds = updatedOrder.items?.map(item => item._id) || [];
    if (itemIds.length > 0) {
      fetch(`/api/items/ratings?itemIds=${itemIds.join(',')}`)
        .then(response => response.json())
        .then(ratings => {
          setItemRatings(prev => ({ ...prev, ...ratings }));
        })
        .catch(error => {
          console.error("Error refreshing ratings:", error);
        });
    }
    
    setShowReviewForm(false);
  };

  const StarRating = ({ rating, size = 20 }) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }
          />
        ))}
      </div>
    );
  };

  const ItemReviewDisplay = ({ item, review }) => {
    const itemReview = review?.itemReviews?.find(ir => ir.itemId === item._id);
    const itemRating = itemRatings[item._id] || {};

    return (
      <div className="mt-1">
        {itemReview && (
          <div className="flex items-center mb-1">
            <span className="text-xs font-medium mr-2">Your rating:</span>
            <StarRating rating={itemReview.rating} size={14} />
          </div>
        )}
        {itemRating.averageRating > 0 && (
          <div className="flex items-center text-xs text-gray-600">
            <span className="mr-1">Average:</span>
            <StarRating rating={Math.round(itemRating.averageRating)} size={14} />
            <span className="ml-1">({itemRating.totalReviews || 0})</span>
          </div>
        )}
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="max-w-md mx-auto p-6 bg-red-50 rounded-lg">
        <div className="flex items-center gap-3 text-red-600 mb-3">
          <AlertCircle className="h-5 w-5" />
          <h3 className="font-medium">Error loading order history</h3>
        </div>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History className="h-6 w-6" /> Order History
        </h1>
        <Link
          href="/auth/dashboard"
          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ChevronLeft className="h-5 w-5 mr-1" /> Back to Dashboard
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-lg text-center border border-gray-200">
          <p className="text-gray-600 mb-4">No order history found</p>
          <Link
            href="/menu"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Menu
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-lg">Order #{order.orderNumber}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(order.createdAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.restaurantName}
                  </p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full ${order.status === 'Delivered'
                  ? 'bg-green-100 text-green-800'
                  : order.status === 'Cancelled'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                  }`}>
                  {order.status}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {order.items?.map((item) => (
                  <div
                    key={item._id}
                    className="flex justify-between text-sm bg-gray-50 px-3 py-2 rounded"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      {order.status === 'Delivered' && (
                        <ItemReviewDisplay item={item} review={order.review} />
                      )}
                    </div>
                    <span className="text-gray-600">
                      {item.quantity} × ₹{item.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>₹{order.totalPrice?.toFixed(2)}</span>
                </div>
              </div>

              {order.status === 'Delivered' && (
                <div className="mt-5 pt-4 border-t border-gray-200">
                  {order.review ? (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium">Your Review</h4>
                        <button
                          onClick={() => handleOpenReviewForm(order)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Edit Review
                        </button>
                      </div>
                      <div className="flex items-center mb-2">
                        <StarRating rating={order.review.overallRating} />
                        <span className="ml-2 text-sm text-gray-600">
                          {order.review.overallRating?.toFixed(1)}/5
                        </span>
                      </div>
                      {order.review.overallComment && (
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                          {order.review.overallComment}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-sm font-medium mb-3">Rate this order</h4>
                      <button
                        onClick={() => handleOpenReviewForm(order)}
                        className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Write a Review
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showReviewForm && (
        <ReviewForm
          order={currentOrder}
          existingReview={currentOrder?.review}
          onClose={() => setShowReviewForm(false)}
          onSuccess={handleReviewSubmitSuccess}
        />
      )}
    </div>
  );
}