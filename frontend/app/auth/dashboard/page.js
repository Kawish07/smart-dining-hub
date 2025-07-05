'use client'
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Package,
  History,
  Loader2,
  AlertCircle,
  ShoppingCart,
  Home,
  X,
  RefreshCcw,
  Bell,
  Settings,
  TrendingUp,
  Clock,
  CheckCircle2,
  User,
  ChevronRight,
  Star,
  Calendar,
  BarChart3,
  CalendarCheck,
  MapPin,
  Phone,
  Mail,
  Users,
  MessageSquare,
  Monitor
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import Recommendations from '@/components/Recommendations';
import OrderCard from '@/components/OrderCard';

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState('live');
  const [orders, setOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [reservationHistory, setReservationHistory] = useState([]);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReservationsLoading, setIsReservationsLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!user?.email) return;

    setIsLoading(true);
    try {
      // Fetch live orders
      const ordersRes = await fetch(`/api/orders?userId=${encodeURIComponent(user.email)}&status=active`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (!ordersRes.ok) {
        throw new Error(`Failed to fetch orders: ${ordersRes.status}`);
      }

      const ordersData = await ordersRes.json();
      const activeOrders = Array.isArray(ordersData) ? ordersData : (ordersData.orders || ordersData.data || []);

      // Filter out any undefined or null entries
      const validActiveOrders = activeOrders.filter(order => order && order._id);
      setOrders(validActiveOrders);

      // Fetch order history
      const historyRes = await fetch(`/api/orders/history?userId=${encodeURIComponent(user.email)}`, {
        cache: 'no-store'
      });

      if (!historyRes.ok) {
        throw new Error('Failed to fetch order history');
      }

      const historyData = await historyRes.json();
      const historyOrdersData = Array.isArray(historyData) ? historyData : (historyData.orders || historyData.data || []);

      // Filter out any undefined or null entries
      const validHistoryOrders = historyOrdersData.filter(order => order && order._id);
      setHistoryOrders(validHistoryOrders);
    } catch (err) {
      console.error('Dashboard error:', err.message);
      setError(err.message);
      toast.error('Failed to load orders', {
        description: 'Please try again later',
        action: {
          label: 'Retry',
          onClick: () => fetchOrders()
        }
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.email]);

 const fetchReservations = useCallback(async () => {
  if (!user?.email) return;

  setIsReservationsLoading(true);
  setError(null); // Reset error state
  
  try {
    // Fetch active reservations
    const activeRes = await fetch(
      `/api/reservations/user?email=${encodeURIComponent(user.email)}&status=active`,
      { cache: 'no-store' }
    );
    
    // Handle non-200 responses
    if (!activeRes.ok) {
      const errorData = await activeRes.json().catch(() => ({}));
      throw new Error(
        errorData.error || 
        `Server returned ${activeRes.status}: ${activeRes.statusText}`
      );
    }

    const activeData = await activeRes.json();
    
    // Validate response structure
    if (!activeData.success || !Array.isArray(activeData.data)) {
      throw new Error('Invalid active reservations data structure');
    }

    setReservations(activeData.data);

    // Fetch reservation history
    const historyRes = await fetch(
      `/api/reservations/user?email=${encodeURIComponent(user.email)}&status=history`,
      { cache: 'no-store' }
    );

    if (!historyRes.ok) {
      const errorData = await historyRes.json().catch(() => ({}));
      throw new Error(
        errorData.error || 
        `Server returned ${historyRes.status}: ${historyRes.statusText}`
      );
    }

    const historyData = await historyRes.json();
    
    if (!historyData.success || !Array.isArray(historyData.data)) {
      throw new Error('Invalid history reservations data structure');
    }

    setReservationHistory(historyData.data);

  } catch (err) {
    console.error('Reservation fetch error:', err);
    setError(err.message);
    toast.error('Failed to load reservations', {
      description: err.message,
      action: {
        label: 'Retry',
        onClick: () => fetchReservations()
      }
    });
  } finally {
    setIsReservationsLoading(false);
  }
}, [user?.email]);

  // Set up SSE connection for real-time updates
  useEffect(() => {
    if (!user?.email) return;

    let eventSource;

    const setupEventSource = () => {
      eventSource = new EventSource(`/api/orders/updates?userId=${encodeURIComponent(user.email)}`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'update' && data.order) {
            setOrders(prevOrders => {
              const existingIndex = prevOrders.findIndex(o => o._id === data.order._id);

              if (existingIndex !== -1) {
                // Update existing order
                const updated = [...prevOrders];
                updated[existingIndex] = data.order;

                // Move to history if completed
                if (['Delivered', 'Cancelled'].includes(data.order.status)) {
                  setHistoryOrders(prev => [data.order, ...prev]);
                  return updated.filter(o => o._id !== data.order._id);
                }

                return updated;
              } else if (!['Delivered', 'Cancelled'].includes(data.order.status)) {
                // Add new order
                return [data.order, ...prevOrders];
              }

              return prevOrders;
            });
          } else if (data.type === 'deleted') {
            setOrders(prev => prev.filter(o => o._id !== data.id));
          }
        } catch (error) {
          console.error('Error processing SSE message:', error);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setTimeout(setupEventSource, 5000);
      };
    };

    setupEventSource();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [user?.email]);

  useEffect(() => {
    if (user?.email) {
      fetchOrders();
      fetchReservations();
    }
  }, [user?.email, fetchOrders, fetchReservations]);

  // Stats calculation
  const stats = {
    activeOrders: orders.length,
    completedOrders: historyOrders.length,
    totalOrders: orders.length + historyOrders.length,
    pendingDeliveries: orders.filter(order => order.status === 'Out for Delivery').length,
    activeReservations: reservations.length,
    completedReservations: reservationHistory.length,
    totalReservations: reservations.length + reservationHistory.length
  };

  const ReservationCard = ({ reservation, isHistory = false }) => {
  // Safely get table number and capacity with fallbacks
  const tableNumber = reservation.tableNumber || reservation.tableId?.slice(-4) || '1';
  const tableCapacity = reservation.tableCapacity || reservation.persons || 'N/A';
  const confirmationId = reservation._id || reservation.confirmationId || 'N/A';
  
  // Format date safely
  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Date not specified';
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid date';
    }
  };

  const formattedDate = formatDate(reservation.date);

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
            <CalendarCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-800">Table #{tableNumber}</h3>
            <p className="text-sm text-slate-600">Max {tableCapacity} people</p>
          </div>
        </div>
        <span className={`px-3 py-1 text-sm rounded-full font-medium ${
          reservation.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
          reservation.status === 'In Process' ? 'bg-yellow-100 text-yellow-800' :
          reservation.status === 'Completed' ? 'bg-green-100 text-green-800' :
          reservation.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {reservation.status || 'Pending'}
        </span>
      </div>

      <div className="space-y-3">
        {/* Confirmation ID */}
        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl">
          <div className="w-5 h-5 bg-gray-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">ID</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800">Confirmation ID</p>
            <div className="flex items-center justify-between">
              <p className="text-sm font-mono text-slate-600">{confirmationId}</p>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(confirmationId);
                  toast.success('Confirmation ID copied!');
                }}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        {/* Date and Time */}
        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
          <Calendar className="h-5 w-5 text-purple-600" />
          <div>
            <p className="font-semibold text-slate-800">
              {formattedDate}
            </p>
            <p className="text-sm text-slate-600">at {reservation.time || 'Not specified'}</p>
          </div>
        </div>

        {/* Party Size */}
        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl">
          <Users className="h-5 w-5 text-emerald-600" />
          <div>
            <p className="font-semibold text-slate-800">
              {reservation.persons || '0'} {reservation.persons === 1 ? "Person" : "People"}
            </p>
            <p className="text-sm text-slate-600">Party size</p>
          </div>
        </div>

        {/* Payment Information */}
        {reservation.paymentAmount && (
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">₨</span>
            </div>
            <div>
              <p className="font-semibold text-slate-800">PKR {reservation.paymentAmount}</p>
              <p className="text-sm text-slate-600">
                {reservation.paymentMethod || 'Payment'} • {reservation.paymentStatus || 'Pending'}
              </p>
            </div>
          </div>
        )}

        {/* Special Requests */}
        {reservation.specialRequests && (
          <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl">
            <p className="text-sm font-medium text-amber-700 mb-1">Special Requests:</p>
            <p className="text-sm text-amber-800">{reservation.specialRequests}</p>
          </div>
        )}

        {/* Contact and Source Info */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <div className="flex items-center gap-2">
            {reservation.source === 'chatbot' ? (
              <MessageSquare size={16} className="text-indigo-600" />
            ) : (
              <Monitor size={16} className="text-gray-600" />
            )}
            <span className="text-sm text-slate-600">via {reservation.source || 'Web'}</span>
          </div>

          <div className="flex items-center gap-2">
            {reservation.customerPhone && (
              <button
                onClick={() => window.open(`tel:${reservation.customerPhone}`)}
                className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                title="Call Restaurant"
              >
                <Phone size={16} />
              </button>
            )}
            <span className="text-xs text-slate-500">
              {reservation.createdAt && new Date(reservation.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-emerald-50">
        <div className="flex flex-col items-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-teal-400 rounded-full animate-spin animate-reverse"></div>
          </div>
          <p className="text-slate-700 font-semibold mt-6 text-lg">Loading your dashboard...</p>
          <p className="text-slate-500 text-sm mt-1">Setting up your personalized experience</p>
        </div>
      </div>
    );
  }

  if (!user && !authLoading) {
    return null;
  }

  if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-red-100 overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-xl">Connection Error</h3>
            </div>
          </div>
          <div className="p-6">
            <p className="text-slate-600 mb-6 leading-relaxed">{error}</p>
            <button
              onClick={() => {
                setError(null);
                fetchOrders();
                fetchReservations();
              }}
              className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl"
            >
              <RefreshCcw className="h-5 w-5" />
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-emerald-50">
      {/* Enhanced Top Navigation */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20 sticky top-0 z-20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Dashboard
                  </h1>
                  <p className="text-sm text-slate-500">Welcome back, {user?.name?.split(' ')[0] || 'User'}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-200">
                <Bell className="h-5 w-5" />
                {(orders.length + reservations.length) > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {orders.length + reservations.length}
                  </span>
                )}
              </button>

              <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-xl p-2 border border-white/20 shadow-sm">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm shadow-md">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:block">
                  <p className="font-semibold text-slate-800 text-sm">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Active Orders</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{stats.activeOrders}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-emerald-600 text-sm font-medium">Live tracking</span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Active Reservations</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{stats.activeReservations}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                <CalendarCheck className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Calendar className="h-4 w-4 text-purple-500" />
              <span className="text-purple-600 text-sm font-medium">Upcoming</span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Completed Orders</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{stats.completedOrders}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Star className="h-4 w-4 text-teal-500" />
              <span className="text-teal-600 text-sm font-medium">All delivered</span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Out for Delivery</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{stats.pendingDeliveries}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-amber-600 text-sm font-medium">In transit</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Enhanced Sidebar */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 sticky top-24">
              {/* User Profile Section */}
              <div className="flex items-center gap-4 mb-8 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-lg">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-sm text-slate-500 mb-2">{user?.email}</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-amber-400 fill-current" />
                    <span className="text-xs text-slate-600 font-medium">Premium Member</span>
                  </div>
                </div>
              </div>

              {/* Navigation Menu */}
              <nav className="space-y-2">
                <Link
                  href="/dashboard"
                  className="w-full text-left px-4 py-3 rounded-xl flex items-center justify-between bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-lg"
                >
                  <div className="flex items-center">
                    <Home className="mr-3" size={20} />
                    Dashboard
                  </div>
                  <ChevronRight size={16} />
                </Link>

                <button
                  onClick={() => setActiveTab('live')}
                  className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition-all duration-200 ${activeTab === 'live'
                      ? 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                >
                  <div className="flex items-center">
                    <Package className="mr-3" size={20} />
                    Live Orders
                  </div>
                  <div className="flex items-center gap-2">
                    {orders.length > 0 && (
                      <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                        {orders.length}
                      </span>
                    )}
                    <ChevronRight size={16} className={activeTab === 'live' ? 'text-emerald-500' : 'text-slate-400'} />
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('reservations')}
                  className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition-all duration-200 ${activeTab === 'reservations'
                      ? 'bg-purple-50 text-purple-700 font-semibold border border-purple-200 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                >
                  <div className="flex items-center">
                    <CalendarCheck className="mr-3" size={20} />
                    Reservations
                  </div>
                  <div className="flex items-center gap-2">
                    {reservations.length > 0 && (
                      <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                        {reservations.length}
                      </span>
                    )}
                    <ChevronRight size={16} className={activeTab === 'reservations' ? 'text-purple-500' : 'text-slate-400'} />
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('history')}
                  className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition-all duration-200 ${activeTab === 'history'
                      ? 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                >
                  <div className="flex items-center">
                    <History className="mr-3" size={20} />
                    History
                  </div>
                  <div className="flex items-center gap-2">
                    {(historyOrders.length + reservationHistory.length) > 0 && (
                      <span className="bg-slate-200 text-slate-600 text-xs font-medium px-2.5 py-1 rounded-full">
                        {historyOrders.length + reservationHistory.length}
                      </span>
                    )}
                    <ChevronRight size={16} className={activeTab === 'history' ? 'text-emerald-500' : 'text-slate-400'} />
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Recommendations Section */}
            {activeTab === 'live' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-white/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg">
                    <Star className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Recommended for You</h3>
                </div>
                <Recommendations />
              </div>
            )}

            {/* Orders Section */}
            {activeTab !== 'reservations' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-6 border-b border-slate-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      {activeTab === 'live' ? (
                        <>
                          <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg">
                            <Package className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-slate-800">Live Orders</h2>
                            <p className="text-slate-600">Track your active orders in real-time</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="p-3 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl shadow-lg">
                            <History className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-slate-800">Order History</h2>
                            <p className="text-slate-600">View your completed orders</p>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {isLoading ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl">
                          <Loader2 className="animate-spin h-4 w-4 text-slate-500" />
                          <span className="text-slate-600 font-medium">Loading...</span>
                        </div>
                      ) : (
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold ${activeTab === 'live'
                            ? 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border border-emerald-200'
                            : 'bg-gradient-to-r from-teal-100 to-emerald-100 text-teal-700 border border-teal-200'
                          }`}>
                          <div className={`w-2 h-2 rounded-full ${activeTab === 'live' ? 'bg-emerald-500' : 'bg-teal-500'
                            } ${activeTab === 'live' && orders.length > 0 ? 'animate-pulse' : ''}`}></div>
                          <span>
                            {activeTab === 'live' ? `${orders.length} Active` : `${historyOrders.length} Completed`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-teal-400 rounded-full animate-spin animate-reverse"></div>
                      </div>
                    </div>
                  ) : activeTab === 'live' && orders.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-500 rounded-2xl mb-6 shadow-lg">
                        <Package size={40} />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-3">No Active Orders</h3>
                      <p className="text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">
                        Your active orders will appear here with real-time tracking updates. Ready to place your next order?
                      </p>
                      <Link
                        href="/"
                        className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
                      >
                        <ShoppingCart className="mr-3" size={20} />
                        Start Shopping
                      </Link>
                    </div>
                  ) : activeTab === 'history' && historyOrders.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-teal-100 to-emerald-100 text-teal-500 rounded-2xl mb-6 shadow-lg">
                        <History size={40} />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-3">No Order History</h3>
                      <p className="text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">
                        Your completed and delivered orders will appear here. Start your shopping journey today!
                      </p>
                      <Link
                        href="/"
                        className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl hover:from-teal-600 hover:to-emerald-600 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
                      >
                        <ShoppingCart className="mr-3" size={20} />
                        Place Your First Order
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {(activeTab === 'live' ? orders : historyOrders).map(order => (
                        <OrderCard
                          key={order._id}
                          order={order}
                          isHistory={activeTab === 'history'}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reservations Section */}
            {activeTab === 'reservations' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-6 border-b border-slate-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                        <CalendarCheck className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-slate-800">Your Reservations</h2>
                        <p className="text-slate-600">View and manage your upcoming reservations</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isReservationsLoading ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl">
                          <Loader2 className="animate-spin h-4 w-4 text-slate-500" />
                          <span className="text-slate-600 font-medium">Loading...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200">
                          <div className={`w-2 h-2 rounded-full bg-purple-500 ${reservations.length > 0 ? 'animate-pulse' : ''}`}></div>
                          <span>{reservations.length} Upcoming</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  {isReservationsLoading ? (
                    <div className="flex justify-center items-center py-20">
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-pink-400 rounded-full animate-spin animate-reverse"></div>
                      </div>
                    </div>
                  ) : reservations.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 text-purple-500 rounded-2xl mb-6 shadow-lg">
                        <CalendarCheck size={40} />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-3">No Upcoming Reservations</h3>
                      <p className="text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">
                        You don't have any active reservations. Ready to book your next dining experience?
                      </p>
                      <Link
                        href="/reservations"
                        className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
                      >
                        <Calendar className="mr-3" size={20} />
                        Book a Table
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {reservations.map(reservation => (
                        <ReservationCard
                          key={reservation._id}
                          reservation={reservation}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reservation History Section */}
            {activeTab === 'history' && reservationHistory.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden mt-8">
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-6 border-b border-slate-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl shadow-lg">
                        <History className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-slate-800">Reservation History</h2>
                        <p className="text-slate-600">Your past dining experiences</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold bg-gradient-to-r from-teal-100 to-emerald-100 text-teal-700 border border-teal-200">
                      <span>{reservationHistory.length} Completed</span>
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {reservationHistory.map(reservation => (
                      <ReservationCard
                        key={reservation._id}
                        reservation={reservation}
                        isHistory={true}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;