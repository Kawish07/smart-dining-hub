'use client'
import { useState, useEffect } from 'react';
import { Clock, Copy, ChevronDown, Star, X } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import ReviewForm from './ReviewForm';

const OrderCard = ({ order, isHistory = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [loadingReview, setLoadingReview] = useState(false);

  // Moved useEffect outside other logic to make it more independent
  useEffect(() => {
    // Safety check to prevent execution if order doesn't exist
    if (!order || !order._id) return;
    
    const fetchReview = async () => {
      if (isHistory && order.status === "Delivered") {
        try {
          setLoadingReview(true);
          const response = await fetch(`/api/reviews?orderId=${order._id}`);

          if (response.ok) {
            const data = await response.json();
            if (data) {
              setExistingReview(data);
            }
          }
        } catch (error) {
          // Silent error - don't log to console
        } finally {
          setLoadingReview(false);
        }
      }
    };

    fetchReview();
  }, [isHistory, order]);

  // Ensure order has required restaurant data
  const getValidOrderData = () => {
    // Strict validation to prevent accessing invalid properties
    if (!order) {
      return null; // Don't console.error here - return silently
    }
    
    // Check if restaurant data exists in any expected format
    const hasRestaurantId = Boolean(order.restaurantId);
    const hasRestaurantObject = Boolean(order.restaurant && order.restaurant._id);
    
    if (!hasRestaurantId && !hasRestaurantObject) {
      // Don't log anything here - silent failure
      return null;
    }

    // Return a sanitized order object with defined restaurant properties
    return {
      ...order,
      restaurantId: order.restaurantId || (order.restaurant && order.restaurant._id),
      restaurantName: order.restaurantName || (order.restaurant && order.restaurant.name) || 'Restaurant',
      restaurantSlug: order.restaurantSlug || (order.restaurant && order.restaurant.slug) || 'restaurant'
    };
  };

  const handleReviewClick = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    
    // Simplify the validation - just check if we have an order ID
    if (order && order._id) {
      setShowReviewForm(true);
    } else {
      toast.error('Cannot load review form - order information is missing');
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case "Delivered":
        return { bg: "bg-green-100", text: "text-green-800", label: "Delivered" };
      case "Ready":
        return { bg: "bg-orange-100", text: "text-orange-800", label: "Ready for Pickup" };
      case "Preparing":
        return { bg: "bg-blue-100", text: "text-blue-800", label: "Preparing" };
      default:
        return { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending" };
    }
  };

  const status = getStatusStyles(order?.status || 'Pending');

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success("Copied to clipboard!"))
      .catch(() => toast.error("Failed to copy"));
  };

  // Prepare order data with required restaurant information
  const getOrderWithRestaurant = () => {
    if (!order) return {};
    
    // Return a sanitized object with fallbacks for each property
    return {
      ...order,
      restaurantId: order.restaurantId || (order.restaurant && order.restaurant._id) || '',
      restaurantName: order.restaurantName || (order.restaurant && order.restaurant.name) || 'Restaurant',
      restaurantSlug: order.restaurantSlug || (order.restaurant && order.restaurant.slug) || 'restaurant'
    };
  };

  // Safety check to prevent render errors if order is undefined
  if (!order) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden p-4">
        <p className="text-red-500">Error: Order data is missing</p>
      </div>
    );
  }
  
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${isExpanded ? 'ring-2 ring-indigo-500' : ''}`}>
      <div className={`bg-gradient-to-r ${isHistory ? 'from-emerald-500 to-teal-600' : 'from-indigo-600 to-violet-600'} p-4`}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-white">Order #{order.orderNumber || (order._id && order._id.slice(-4)) || 'N/A'}</h3>
            <p className="text-white/80 text-sm">
              {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Date N/A'}
            </p>
          </div>
          <span className={`${status.bg} ${status.text} px-3 py-1 rounded-full text-xs font-semibold`}>
            {status.label}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {!isHistory && order && order.restaurantSlug && (
          <Link
            href={`/${order.restaurantSlug}/tracking?orderId=${order._id || ''}`}
            className="flex items-center justify-center p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100"
          >
            <Clock size={16} className="mr-2" />
            <span className="text-sm font-medium">Track Order</span>
          </Link>
        )}

        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Total</p>
            <p className="font-bold">Rs {order.totalPrice?.toFixed(2) || '0.00'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Payment</p>
            <p className="font-medium">{order.paymentMethod || 'Unknown'}</p>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            <span className="text-sm font-medium mr-1">Details</span>
            <ChevronDown size={16} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium mb-1">Items</p>
              <ul className="space-y-1">
                {order.items?.map((item, i) => (
                  <li key={i} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded">
                    <span className="text-gray-800">{item.name}</span>
                    <span className="text-indigo-600 font-medium">x{item.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-1">Order ID</p>
                <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                  <code className="text-xs truncate">{order._id}</code>
                  <button
                    onClick={() => copyToClipboard(order._id)}
                    className="text-indigo-600 hover:text-indigo-800 ml-2"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
              {order.transactionId && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Transaction ID</p>
                  <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                    <code className="text-xs truncate">{order.transactionId}</code>
                    <button
                      onClick={() => copyToClipboard(order.transactionId)}
                      className="text-indigo-600 hover:text-indigo-800 ml-2"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {isHistory && order.status === "Delivered" && (
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-800">Your Review</h4>
                  {existingReview && (
                    <button
                    onClick={handleReviewClick}
                    className="w-full py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 border border-dashed border-indigo-200 rounded-lg"
                  >
                    + Write a Review
                  </button>
                  )}
                </div>

                {loadingReview ? (
                  <div className="flex justify-center py-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  </div>
                ) : existingReview ? (
                  <div className="space-y-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={18}
                          className={
                            star <= existingReview.rating
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                          }
                        />
                      ))}
                    </div>
                    {existingReview.comment && (
                      <p className="text-gray-700 text-sm">{existingReview.comment}</p>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handleReviewClick}
                    className="w-full py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 border border-dashed border-indigo-200 rounded-lg"
                  >
                    + Write a Review
                  </button>
                )}
              </div>
            )}

            {showReviewForm && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl max-w-md w-full p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">
                      {existingReview ? "Edit Your Review" : "Rate Your Experience"}
                    </h3>
                    <button
                      onClick={() => setShowReviewForm(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  {/* Only render the form if we have valid order data */}
                  <ReviewForm
                    order={getValidOrderData() || {}}
                    existingReview={existingReview}
                    onClose={() => setShowReviewForm(false)}
                    onSuccess={(newReview) => {
                      setExistingReview(newReview);
                      setShowReviewForm(false);
                      toast.success(existingReview ? "Review updated!" : "Thank you for your review!");
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderCard;