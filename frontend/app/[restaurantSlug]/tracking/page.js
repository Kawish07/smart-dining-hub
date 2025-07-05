"use client";
import { useState, useEffect } from "react";

const TrackOrder = () => {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Function to fetch order details
  const fetchOrder = async () => {
    if (!orderId) {
      setError("Please enter an Order ID to track your order.");
      return;
    }

    setLoading(true);
    setError(null);
    setOrder(null); // Clear previous order data

    try {
      const response = await fetch(`/api/track-order?orderId=${orderId}`);
      const data = await response.json();

      if (!response.ok) {
        // Handle API errors (e.g., 400 or 404)
        throw new Error(data.error || "Failed to fetch order. Please try again later.");
      }

      // Set the order data if found
      setOrder(data);
      // After successfully fetching the order, set up SSE for real-time updates
      setupRealTimeUpdates(data._id);
    } catch (error) {
      console.error("Error fetching order:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to set up real-time updates with SSE
  const setupRealTimeUpdates = (id) => {
    if (typeof EventSource === 'undefined') {
      console.warn("EventSource is not supported in this browser. Real-time updates will not work.");
      return;
    }

    // Close any existing connections
    if (window.orderEventSource) {
      window.orderEventSource.close();
    }

    // Create a new EventSource connection
    window.orderEventSource = new EventSource(`/api/kitchen/updates?orderId=${id}`);

    window.orderEventSource.onmessage = (event) => {
      try {
        const updatedOrder = JSON.parse(event.data);
        
        // Only update if the order ID matches
        if (updatedOrder._id === id) {
          console.log("Received real-time update:", updatedOrder);
          setOrder(prevOrder => ({
            ...prevOrder,
            ...updatedOrder
          }));
        }
      } catch (error) {
        console.error("Error parsing SSE data:", error);
      }
    };

    window.orderEventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      // Close the connection on error
      window.orderEventSource.close();
    };

    // Cleanup function
    return () => {
      if (window.orderEventSource) {
        window.orderEventSource.close();
      }
    };
  };

  // Cleanup SSE connection when component unmounts
  useEffect(() => {
    return () => {
      if (window.orderEventSource) {
        window.orderEventSource.close();
      }
    };
  }, []);

  // Function to calculate the current status based on kitchen status
  const calculateStatus = (order) => {
    // Prioritize kitchenStatus if available
    const status = order.kitchenStatus || order.status || "Pending";
    
    // Map status to display format
    switch (status) {
      case "Pending":
        return { status: "Pending", color: "#14b8a6", percent: 25 };
      case "Preparing":
        return { status: "Preparing", color: "#14b8a6", percent: 50 };
      case "Ready":
        return { status: "Ready for Pickup", color: "#14b8a6", percent: 75 };
      case "Delivered":
        return { status: "Delivered", color: "#14b8a6", percent: 100 };
      default:
        return { status: "Pending", color: "#14b8a6", percent: 25 };
    }
  };

  // Function to get estimated delivery time
  const getEstimatedDelivery = (createdAt, estimatedPreparationTime) => {
    const orderDate = new Date(createdAt);
    // Use estimatedPreparationTime from the order if available, otherwise default to 30 minutes
    const minutes = estimatedPreparationTime || 30;
    const deliveryDate = new Date(orderDate.getTime() + minutes * 60000);
    
    return deliveryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 p-6">
      <div className="max-w-lg mx-auto">
        {/* Stylish Header with Animated Elements */}
        <div className="relative text-center mb-8">
          <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-teal-100 opacity-60 animate-pulse"></div>
          <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-cyan-100 opacity-60"></div>
          <h1 className="text-4xl font-bold text-teal-700 mb-2 relative z-10">
            Track Your Order
          </h1>
          <p className="text-teal-600 relative z-10">
            Watch your order journey in real-time
          </p>
        </div>
        
        {/* Order ID Input Card with Glass Effect */}
        <div className="backdrop-blur-sm bg-white bg-opacity-70 p-8 rounded-3xl shadow-lg mb-8 border border-teal-100 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-teal-100 to-cyan-50 opacity-30"></div>
          
          <div className="flex items-center mb-6 bg-white bg-opacity-80 p-4 rounded-xl border border-teal-200 shadow-inner">
            <svg className="w-5 h-5 text-teal-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <input
              type="text"
              className="flex-grow bg-transparent focus:outline-none text-gray-700 placeholder-teal-300"
              placeholder="Enter your Order ID"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
            />
            {orderId && (
              <button 
                onClick={() => setOrderId("")}
                className="text-teal-400 hover:text-teal-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
          
          <button
            onClick={fetchOrder}
            disabled={loading}
            className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 py-4 rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all transform hover:scale-[1.02] shadow-md hover:shadow-lg flex items-center justify-center font-medium"
          >
            {loading ? (
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
            {loading ? "Finding Your Order..." : "Track My Order"}
          </button>
        </div>

        {/* Error Message with Animation */}
        {error && (
          <div className="bg-red-50 p-6 rounded-xl border border-red-100 mb-8 shadow-md animate-fade-in">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-red-800 font-medium mb-1">Unable to track order</h3>
                <p className="text-red-600 text-sm">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Order Details Card with Modern Design */}
        {order && (
          <div className="bg-white bg-opacity-90 backdrop-blur-sm p-8 rounded-3xl shadow-lg mb-8 border border-teal-100 relative">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-teal-100 to-transparent rounded-tr-3xl"></div>
            <div className="absolute bottom-0 left-0 h-16 w-16 bg-gradient-to-tr from-cyan-100 to-transparent rounded-bl-3xl"></div>
            
            <div className="flex justify-between items-center mb-6 relative">
              <div>
                <span className="text-xs uppercase tracking-wider text-teal-600 font-semibold bg-teal-50 px-2 py-1 rounded-md">Your Order</span>
                <h2 className="text-2xl font-bold text-gray-800 mt-1">#{order._id}</h2>
              </div>
              <div className="z-10">
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-teal-50 text-teal-600 border border-teal-200">
                  <span className="w-2 h-2 bg-teal-500 rounded-full mr-2 animate-pulse"></span>
                  {calculateStatus(order).status}
                </span>
              </div>
            </div>
            
            {/* Order progress with animated elements */}
            <div className="mb-8">
              <div className="relative pt-1">
                <div className="flex mb-3 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-md text-teal-600 bg-teal-50">
                      Order Journey
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-teal-600">
                      {calculateStatus(order).percent}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-teal-100">
                  <div 
                    style={{ 
                      width: `${calculateStatus(order).percent}%`,
                      transition: "width 1s ease-in-out, background-color 1s ease-in-out" 
                    }} 
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-teal-400 to-teal-600 rounded-full"
                  ></div>
                </div>
              </div>
              
              {/* Order Status Steps with Icons */}
              <div className="flex justify-between mb-8">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${calculateStatus(order).status === "Pending" ? "bg-teal-600 text-white" : "bg-teal-100 text-teal-600"}`}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className={`text-xs ${calculateStatus(order).status === "Pending" ? "font-bold text-teal-600" : "text-gray-500"}`}>Placed</span>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${calculateStatus(order).status === "Preparing" ? "bg-teal-600 text-white" : "bg-teal-100 text-teal-600"}`}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className={`text-xs ${calculateStatus(order).status === "Preparing" ? "font-bold text-teal-600" : "text-gray-500"}`}>Preparing</span>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${calculateStatus(order).status === "Ready for Pickup" ? "bg-teal-600 text-white" : "bg-teal-100 text-teal-600"}`}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className={`text-xs ${calculateStatus(order).status === "Ready for Pickup" ? "font-bold text-teal-600" : "text-gray-500"}`}>Ready</span>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${calculateStatus(order).status === "Delivered" ? "bg-teal-600 text-white" : "bg-teal-100 text-teal-600"}`}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <span className={`text-xs ${calculateStatus(order).status === "Delivered" ? "font-bold text-teal-600" : "text-gray-500"}`}>Delivered</span>
                </div>
              </div>
              
              {/* Delivery Time Info Card */}
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-xl shadow-inner mb-4 flex items-center">
                <div className="bg-white p-2 rounded-lg mr-3">
                  <svg className="w-6 h-6 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estimated time</p>
                  <p className="font-bold text-teal-700">{getEstimatedDelivery(order.createdAt, order.estimatedPreparationTime)}</p>
                </div>
              </div>
              
              {/* Real-time Status Badge */}
              <div className="flex items-center justify-center py-2 px-4 bg-teal-600 text-white rounded-lg text-sm">
                <div className="flex items-center">
                  <span className="relative flex h-3 w-3 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                  </span>
                  <span>Live updates enabled</span>
                </div>
              </div>
            </div>
            
            {/* Order Items with Modern Design */}
            <div className="mb-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 text-teal-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                Your Order Items
              </h3>
              <div className="bg-teal-50 rounded-xl overflow-hidden shadow-inner">
                <ul className="divide-y divide-teal-100">
                  {order.items.map((item, i) => (
                    <li key={i} className="p-4 hover:bg-teal-100 transition-colors">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="w-8 h-8 flex items-center justify-center bg-teal-600 text-white rounded-lg text-xs mr-3 font-bold">
                            {item.quantity}
                          </span>
                          <div>
                            <span className="text-gray-800 font-medium">{item.name}</span>
                            {item.variant && <span className="text-xs text-teal-600 block">{item.variant}</span>}
                          </div>
                        </div>
                        <span className="font-medium text-teal-700">Rs {item.quantity * (item.price || 0)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
                
                <div className="border-t border-teal-200 p-4 bg-teal-100">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Total Amount</span>
                    <span className="font-bold text-xl text-teal-700">Rs {order.totalPrice}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Support Card with Wave Design */}
            <div className="relative bg-gradient-to-r from-teal-600 to-teal-500 rounded-xl p-6 text-white overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-24 opacity-20">
                <svg viewBox="0 0 1000 150" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <path d="M0,100 C150,200 350,0 500,100 C650,200 850,0 1000,100 L1000,0 L0,0 Z" fill="white"></path>
                </svg>
              </div>
              <div className="relative z-10">
                <h3 className="font-bold text-xl mb-2">Need Help?</h3>
                <p className="text-teal-100 mb-4">Our support team is ready to assist you with your order</p>
                <div className="flex">
                  <div className="mr-4">
                    <p className="text-teal-100 text-sm mb-1">Call us</p>
                    <p className="font-bold">+1 555-123-4567</p>
                  </div>
                  <a href="/contact" className="ml-auto">
                    <button className="bg-white text-teal-600 hover:bg-teal-50 font-medium py-2 px-4 rounded-lg transition-colors">
                      Contact Support
                    </button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Quick Tips Card with Better Visual Design */}
        {!order && !loading && !error && (
          <div className="bg-white bg-opacity-80 backdrop-blur-sm p-6 rounded-3xl shadow-lg border border-teal-100 relative overflow-hidden">
            <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-tl from-teal-100 to-transparent"></div>
            
            <h3 className="font-bold text-teal-700 mb-4 flex items-center">
              <svg className="w-5 h-5 text-teal-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Tips for Tracking Your Order
            </h3>
            
            <ul className="space-y-4 relative z-10">
              <li className="flex items-start bg-teal-50 p-3 rounded-xl border-l-4 border-teal-400">
                <div className="bg-teal-100 p-2 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-teal-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <span className="font-semibold text-teal-700 block mb-1">Real-time Updates</span>
                  <span className="text-sm text-gray-600">Order status updates in real-time as your order progresses</span>
                </div>
              </li>
              
              <li className="flex items-start bg-teal-50 p-3 rounded-xl border-l-4 border-teal-400">
                <div className="bg-teal-100 p-2 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-teal-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0c0 .993-.241 1.929-.668 2.754l-1.524-1.525a3.997 3.997 0 00.078-2.183l1.562-1.562C15.802 8.249 16 9.1 16 10zm-5.165 3.913l1.58 1.58A5.98 5.98 0 0110 16a5.976 5.976 0 01-2.516-.552l1.562-1.562a4.006 4.006 0 001.789.027zm-4.677-2.796a4.002 4.002 0 01-.041-2.08l-.08.08-1.53-1.533A5.98 5.98 0 004 10c0 .954.223 1.856.619 2.657l1.54-1.54zm1.088-6.45A5.974 5.974 0 0110 4c.954 0 1.856.223 2.657.619l-1.54 1.54a4.002 4.002 0 00-2.346.033L7.246 4.668zM12 10a2 2 0 11-4 0 2 2 0 014 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <span className="font-semibold text-teal-700 block mb-1">Need Support?</span>
                  <span className="text-sm text-gray-600">Contact our support team for immediate assistance</span>
                </div>
              </li>
            </ul>
            
            {/* Quick Access Card */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-4 rounded-xl text-white mt-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 opacity-20">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 5.07089C16.3923 5.55612 19 8.47353 19 12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12C5 8.47353 7.60769 5.55612 11 5.07086V9L13 5.07089Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h4 className="font-semibold mb-2">Quick Start</h4>
              <p className="text-sm text-teal-100 mb-3">Enter your Order ID and track your delivery in real-time!</p>
              <div className="relative z-10">
                <a href="#" onClick={(e) => {
                  e.preventDefault();
                  document.querySelector('input').focus();
                }}>
                  <button className="bg-white text-teal-600 hover:bg-teal-50 font-medium py-2 px-4 rounded-lg transition-colors text-sm flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Start Tracking
                  </button>
                </a>
              </div>
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="text-center text-teal-600 text-sm mt-8">
          <p>© {new Date().getFullYear()} Your Restaurant Name. All rights reserved.</p>
        </div>
      </div>
      
      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { 
            opacity: 0;
            transform: translateY(10px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease forwards;
        }
      `}</style>
    </div>
  );
};

export default TrackOrder;