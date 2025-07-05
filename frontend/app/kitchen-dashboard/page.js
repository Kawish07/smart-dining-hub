"use client";
import { useEffect, useState, useMemo } from "react";
import {
  Clock,
  CheckCircle,
  Utensils,
  AlertCircle,
  ChefHat,
  Trash2,
  Filter,
  CreditCard,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";

const KitchenDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [orderToDelete, setOrderToDelete] = useState(null);

  // Payment status configuration
  const PAYMENT_STATUS_CONFIG = {
    pending: {
      color: "bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800",
      icon: Clock,
      text: "Payment Pending",
    },
    confirmed: {
      color: "bg-gradient-to-r from-green-100 to-green-50 text-green-800",
      icon: CheckCircle,
      text: "Payment Confirmed",
    },
    failed: {
      color: "bg-gradient-to-r from-red-100 to-red-50 text-red-800",
      icon: AlertCircle,
      text: "Payment Failed",
    },
  };

  // Kitchen status configuration with next actions
  const KITCHEN_STATUS_CONFIG = {
    Pending: {
      color: "bg-blue-100 text-blue-800",
      icon: Clock,
      text: "Pending",
      nextStatus: "Preparing",
      buttonText: "Start Preparing",
      buttonClass: "bg-blue-600 hover:bg-blue-700",
    },
    Preparing: {
      color: "bg-orange-100 text-orange-800",
      icon: Utensils,
      text: "Preparing",
      nextStatus: "Ready",
      buttonText: "Mark as Ready",
      buttonClass: "bg-orange-600 hover:bg-orange-700",
    },
    Ready: {
      color: "bg-green-100 text-green-800",
      icon: CheckCircle,
      text: "Ready",
      nextStatus: "Delivered",
      buttonText: "Mark as Delivered",
      buttonClass: "bg-green-600 hover:bg-green-700",
    },
    Delivered: {
      color: "bg-gray-100 text-gray-500",
      icon: AlertCircle,
      text: "Delivered",
      nextStatus: null,
      buttonText: null,
      buttonClass: "",
    },
  };

  // Calculate payment status safely
  const getPaymentStatus = (order) => {
    return order?.paymentStatus || "pending";
  };

  // Calculate kitchen status safely
  const getKitchenStatus = (order) => {
    return order?.kitchenStatus || order?.status || "Pending";
  };

  // Filter orders - show all orders regardless of payment status
  const filteredOrders = useMemo(() => {
    const ordersList = Array.isArray(orders) ? orders : [];
    return ordersList.filter((order) => {
      if (!order) return false;
      const paymentStatus = getPaymentStatus(order);
      return !order.kitchenHidden && (filter === "All" || paymentStatus === filter);
    });
  }, [orders, filter]);

  // Auto-refresh orders every 5 seconds
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch("/api/kitchen?dashboard=kitchen", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch orders: ${response.status}`);
        }

        const data = await response.json();
        const ordersArray = Array.isArray(data) ? data : data.orders ? data.orders : [];
        setOrders(ordersArray);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setError(error.message);
        toast.error(error.message || "Failed to fetch orders");
      }
    };

    const intervalId = setInterval(fetchOrders, 5000); // Refresh every 5 seconds

    // Initial fetch
    fetchOrders().finally(() => setIsLoading(false));

    return () => clearInterval(intervalId);
  }, []);

  // Update payment status only
  const updatePaymentStatus = async (orderId, newPaymentStatus) => {
    if (!orderId) {
      toast.error("Invalid order ID");
      return;
    }

    try {
      const response = await fetch(`/api/kitchen/order/${orderId}/payment`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentStatus: newPaymentStatus
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to update payment status";

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          errorMessage = `${errorMessage}: ${response.status} ${response.statusText}`;
        }

        throw new Error(errorMessage);
      }

      toast.success(`Payment status updated to ${newPaymentStatus}`);
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast.error(error.message || "Failed to update payment status");
    }
  };

  // Update kitchen status
  // Update the updateKitchenStatus function in your component
// In your kitchen dashboard component
const updateKitchenStatus = async (orderId, newKitchenStatus) => {
  if (!orderId) {
    toast.error("Invalid order ID");
    return;
  }
  
  try {
    const response = await fetch(`/api/kitchen/order/${orderId}/status`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        kitchenStatus: newKitchenStatus,
        status: newKitchenStatus
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to update kitchen status: ${response.status}`);
    }

    const data = await response.json();
    toast.success(`Order status updated to ${newKitchenStatus}`);
    
    // Optimistically update the UI
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order && order._id === orderId 
          ? { 
              ...order, 
              kitchenStatus: newKitchenStatus,
              status: newKitchenStatus 
            }
          : order
      )
    );

  } catch (error) {
    console.error("Error updating kitchen status:", error);
    toast.error(error.message || "Failed to update kitchen status");
    
    if (error.message.includes("404")) {
      console.error("Endpoint not found. Verify the API route exists at:");
      console.error("app/api/kitchen/order/[id]/status/route.js");
    }
  }
};

  // Remove order from kitchen view (doesn't delete from database)
  const removeFromKitchenView = async (orderId) => {
    if (!orderId) {
      toast.error("Invalid order ID");
      setOrderToDelete(null);
      return;
    }

    try {
      const response = await fetch(`/api/kitchen/order/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ kitchenHidden: true }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to remove order";

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (jsonError) {
            console.error("Error parsing JSON error:", jsonError);
          }
        }

        throw new Error(errorMessage);
      }

      toast.success("Order removed from kitchen view");
      setOrderToDelete(null);
    } catch (error) {
      console.error("Error removing order:", error);
      toast.error(error.message || "Error removing order from view");
      setOrderToDelete(null);
    }
  };

  // Confirmation modal for removing orders from kitchen view
  const DeleteConfirmationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Confirm Removal</h2>
        <p className="mb-6">This will remove the order from the kitchen view but keep it in the system.</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => setOrderToDelete(null)}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={() => removeFromKitchenView(orderToDelete)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-50 to-gray-100 p-6">
      <div className="container mx-auto">
        {/* Header with Filter Options */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 flex items-center mb-4 md:mb-0">
            <ChefHat className="mr-4 text-blue-600" />
            Kitchen Dashboard
          </h1>
          <div className="flex flex-wrap gap-2">
            {["All", "pending", "confirmed", "failed"].map((statusFilter) => (
              <button
                key={statusFilter}
                onClick={() => setFilter(statusFilter)}
                className={`
                  px-4 py-2 rounded-md transition-all flex items-center capitalize
                  ${filter === statusFilter
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"}
                `}
              >
                <Filter className="mr-2" size={16} />
                {statusFilter === "All" ? "All Orders" : `${statusFilter} Payment`}
              </button>
            ))}
          </div>
        </div>

        {/* Error Handling */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
            <button
              onClick={() => setError(null)}
              className="absolute top-0 right-0 m-2 text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center text-gray-600 py-8">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
            <p className="mt-4">Loading orders...</p>
          </div>
        )}

        {/* Orders Grid */}
        {filteredOrders.length === 0 && !isLoading ? (
          <div className="text-center text-gray-600 py-8">
            <p>No orders found with the current filter.</p>
            {filter !== "All" && (
              <button
                onClick={() => setFilter("All")}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Show All Orders
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => {
              if (!order) return null;

              const paymentStatus = getPaymentStatus(order);
              const kitchenStatus = getKitchenStatus(order);

              const PaymentIcon = PAYMENT_STATUS_CONFIG[paymentStatus]?.icon || Clock;
              const paymentConfig = PAYMENT_STATUS_CONFIG[paymentStatus] || PAYMENT_STATUS_CONFIG.pending;

              const KitchenIcon = KITCHEN_STATUS_CONFIG[kitchenStatus]?.icon || Clock;
              const kitchenConfig = KITCHEN_STATUS_CONFIG[kitchenStatus] || KITCHEN_STATUS_CONFIG.Pending;

              const displayOrderNumber = order.orderNumber || (order._id ? `ID-${order._id.slice(-6)}` : 'Unknown');

              return (
                <div
                  key={order._id || Math.random().toString()}
                  className="bg-white shadow-lg rounded-xl overflow-hidden transform transition-all hover:scale-105 hover:shadow-xl"
                >
                  {/* Payment Status Header */}
                  <div className={`p-4 flex justify-between items-center ${paymentConfig.color}`}>
                    <div className="flex items-center">
                      <PaymentIcon className="mr-2" />
                      <span className="font-bold mr-2">#{displayOrderNumber}</span>
                    </div>
                    <span className="text-sm font-semibold uppercase">{paymentConfig.text}</span>
                  </div>

                  {/* Kitchen Status Badge */}
                  <div className="px-4 pt-2">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${kitchenConfig.color}`}>
                      <KitchenIcon className="mr-1" size={12} />
                      Kitchen: {kitchenConfig.text}
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="p-4">
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">
                        Table: {order.tableNumber || '1'}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        Ordered: {new Date(order.createdAt || Date.now()).toLocaleString()}
                      </p>
                      {Array.isArray(order.items) ? order.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between border-b py-2 last:border-b-0"
                        >
                          <span>{item?.name || 'Unknown Item'}</span>
                          <span className="font-semibold">
                            x{item?.quantity || 1} - Rs {(item?.price || 0) * (item?.quantity || 1)}
                          </span>
                        </div>
                      )) : (
                        <p className="text-gray-500 italic">No items available</p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-800">
                          Total: Rs {order.totalPrice || 0}
                        </span>
                      </div>

                      {/* Kitchen Status Controls (for kitchen staff) */}
                      {paymentStatus === "confirmed" && kitchenConfig.nextStatus && (
                        <div className="flex flex-col space-y-2">
                          <label className="text-sm font-medium text-gray-700">Kitchen Status:</label>
                          <button
                            onClick={() => updateKitchenStatus(order._id, kitchenConfig.nextStatus)}
                            className={`${kitchenConfig.buttonClass} text-white px-4 py-2 rounded-md transition-colors flex items-center justify-center`}
                          >
                            <Utensils className="mr-2" size={16} />
                            {kitchenConfig.buttonText}
                          </button>
                        </div>
                      )}

                      {/* Kitchen Status Note */}
                      {paymentStatus === "confirmed" && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-sm text-green-800">
                            ✓ Payment confirmed - Kitchen can start preparing this order
                          </p>
                        </div>
                      )}

                      {paymentStatus === "pending" && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-sm text-yellow-800">
                            ⏳ Awaiting payment confirmation before kitchen preparation
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {orderToDelete && <DeleteConfirmationModal />}
      </div>
    </div>
  );
};

export default KitchenDashboard;