"use client";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CategoryForm from "@/components/CategoryForm";
import ItemForm from "@/components/ItemForm";
import CategoryList from "@/components/CategoryList";
import ItemList from "@/components/ItemList";
import SpecialDishForm from "@/components/SpecialDishForm";
import SpecialsList from "@/components/SpecialsList";
import TableForm from "@/components/TableForm";
import TableList from "@/components/TableList";

export default function AdminDashboard() {
  const router = useRouter();
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [specials, setSpecials] = useState([]);
  const [tables, setTables] = useState([]);
  
  // New state for analytics and staff management
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    deliveredOrders: 0,
    totalUsers: 0,
    totalStaff: 0,
    recentOrders: []
  });
  const [staff, setStaff] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    role: "waiter",
    phone: "",
    restaurantId: ""
  });

  const [loading, setLoading] = useState({
    main: false,
    restaurants: false,
    categories: false,
    items: false,
    specials: false,
    tables: false,
    analytics: false,
    staff: false,
    users: false,
    orders: false
  });
  const [newRestaurant, setNewRestaurant] = useState({
    name: "",
    slug: "",
    image: ""
  });
  const [activeTab, setActiveTab] = useState("overview");

  // Debugging state
  const [debugInfo, setDebugInfo] = useState({
    lastError: null,
    apiCalls: [],
    currentState: {}
  });

  // Toast configuration
  const notify = (message, type = 'success') => {
    console.log(`Toast Notification: ${type} - ${message}`);
    toast[type](message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  // Update debug info
  const updateDebugInfo = (updates) => {
    setDebugInfo(prev => ({
      ...prev,
      ...updates,
      currentState: {
        selectedRestaurant,
        categories,
        items,
        specials,
        tables,
        activeTab,
        analytics,
        staff: staff.length,
        users: users.length,
        orders: orders.length
      }
    }));
  };

  // Fetch orders data and calculate revenue
 const fetchOrders = async (restaurantId = null) => {
  setLoading(prev => ({ ...prev, orders: true }));
  
  try {
    const url = restaurantId 
      ? `/api/orders?restaurantId=${restaurantId}` 
      : "/api/orders";
    
    const response = await fetch(url, { cache: "no-store" });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch orders");
    }

    const result = await response.json();
    
    // Handle the actual API response structure
    let orders = [];
    if (result.success && Array.isArray(result.orders)) {
      orders = result.orders;
    } else if (Array.isArray(result)) {
      // Fallback for direct array response
      orders = result;
    } else {
      throw new Error(`Unexpected orders format: ${JSON.stringify(result)}`);
    }

    // Add defensive checks for missing fields
    const validatedOrders = orders.map(order => ({
      ...order,
      totalPrice: order.totalPrice || 0, // Default to 0 if missing
      status: order.status || 'unknown'  // Default status if missing
    }));

    setOrders(validatedOrders);
    
    // Calculate analytics with safe defaults
    const totalRevenue = validatedOrders.reduce(
      (sum, order) => sum + (order.totalPrice || 0), 
      0
    );
    
    const totalOrders = validatedOrders.length;
    const deliveredOrders = validatedOrders.filter(order => 
      order.status && order.status.toLowerCase() === 'delivered'
    ).length;
    
    setAnalytics(prev => ({
      ...prev,
      totalRevenue,
      totalOrders,
      deliveredOrders,
      recentOrders: validatedOrders.slice(0, 5)
    }));

  } catch (error) {
    console.error("Orders fetch error:", error);
    notify(error.message, 'error');
  } finally {
    setLoading(prev => ({ ...prev, orders: false }));
  }
};
  // Fetch analytics data
  const fetchAnalytics = async (restaurantId = null) => {
    setLoading(prev => ({ ...prev, analytics: true }));
    updateDebugInfo({ lastAction: "Fetching analytics data" });
    
    try {
      console.log("Fetching analytics...");
      
      // Fetch orders to calculate revenue
      await fetchOrders(restaurantId);
      
      // Update staff count in analytics
      setAnalytics(prev => ({
        ...prev,
        totalStaff: staff.length,
        totalUsers: users.length
      }));
      
      updateDebugInfo({
        apiCalls: [...debugInfo.apiCalls, {
          endpoint: "/api/analytics",
          method: "GET",
          status: "success",
          timestamp: new Date().toISOString()
        }]
      });
      
    } catch (error) {
      console.error("Analytics fetch error:", error);
      updateDebugInfo({
        lastError: error.message,
        apiCalls: [...debugInfo.apiCalls, {
          endpoint: "/api/analytics",
          method: "GET",
          status: "error",
          error: error.message,
          timestamp: new Date().toISOString()
        }]
      });
      notify(error.message, 'error');
    } finally {
      setLoading(prev => ({ ...prev, analytics: false }));
    }
  };

  // Fetch staff data
  const fetchStaff = async (restaurantId = null) => {
  setLoading(prev => ({ ...prev, staff: true }));
  updateDebugInfo({ lastAction: "Fetching staff data" });
  
  try {
    console.log("Fetching staff...");
    const url = restaurantId 
      ? `/api/staff?restaurantId=${restaurantId}` 
      : "/api/staff";
    
    const response = await fetch(url, { cache: "no-store" });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch staff");
    }

    const data = await response.json();
    
    // Ensure data is an array
    if (!Array.isArray(data)) {
      throw new Error("Invalid staff data format");
    }
    
    console.log("Staff fetched successfully:", data);
    setStaff(data);
    
    // Update analytics with staff count
    setAnalytics(prev => ({
      ...prev,
      totalStaff: data.length
    }));
    
    updateDebugInfo({
      apiCalls: [...debugInfo.apiCalls, {
        endpoint: "/api/staff",
        method: "GET",
        status: "success",
        timestamp: new Date().toISOString()
      }]
    });
    
  } catch (error) {
    console.error("Staff fetch error:", error);
    updateDebugInfo({
      lastError: error.message,
      apiCalls: [...debugInfo.apiCalls, {
        endpoint: "/api/staff",
        method: "GET",
        status: "error",
        error: error.message,
        timestamp: new Date().toISOString()
      }]
    });
    notify(error.message, 'error');
  } finally {
    setLoading(prev => ({ ...prev, staff: false }));
  }
};

const fetchUsers = async () => {
  setLoading(prev => ({ ...prev, users: true }));
  updateDebugInfo({ lastAction: "Fetching users data" });
  
  try {
    console.log("Fetching users...");
    const response = await fetch("/api/users", { cache: "no-store" });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch users");
    }

    const data = await response.json();
    
    // Ensure data is an array
    if (!Array.isArray(data)) {
      throw new Error("Invalid users data format");
    }
    
    console.log("Users fetched successfully:", data);
    setUsers(data);
    
    // Update analytics with user count
    setAnalytics(prev => ({
      ...prev,
      totalUsers: data.length
    }));
    
    updateDebugInfo({
      apiCalls: [...debugInfo.apiCalls, {
        endpoint: "/api/users",
        method: "GET",
        status: "success",
        timestamp: new Date().toISOString()
      }]
    });
    
  } catch (error) {
    console.error("Users fetch error:", error);
    updateDebugInfo({
      lastError: error.message,
      apiCalls: [...debugInfo.apiCalls, {
        endpoint: "/api/users",
        method: "GET",
        status: "error",
        error: error.message,
        timestamp: new Date().toISOString()
      }]
    });
    notify(error.message, 'error');
  } finally {
    setLoading(prev => ({ ...prev, users: false }));
  }
};
const fetchTables = async (restaurantId) => {
  setLoading(prev => ({ ...prev, tables: true }));
  
  try {
    const url = restaurantId 
      ? `/api/tables?restaurantId=${restaurantId}`
      : "/api/tables";
    
    const response = await fetch(url, { cache: "no-store" });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch tables");
    }

    const data = await response.json();
    setTables(data);
  } catch (error) {
    console.error("Tables fetch error:", error);
    notify(error.message, 'error');
  } finally {
    setLoading(prev => ({ ...prev, tables: false }));
  }
};

  // Add new staff member
  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!selectedRestaurant) {
      notify('Please select a restaurant first', 'error');
      return;
    }

    setLoading(prev => ({ ...prev, staff: true }));
    updateDebugInfo({ lastAction: "Adding new staff member" });
    
    try {
      const staffData = {
        ...newStaff,
        restaurantId: selectedRestaurant._id
      };
      
      console.log("Adding staff with data:", staffData);
      const response = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(staffData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add staff member");
      }

      const data = await response.json();
      console.log("Staff member added successfully:", data);
      
      setStaff([...staff, data]);
      setNewStaff({ name: "", email: "", role: "waiter", phone: "", restaurantId: "" });
      
      updateDebugInfo({
        apiCalls: [...debugInfo.apiCalls, {
          endpoint: "/api/staff",
          method: "POST",
          status: "success",
          data: staffData,
          timestamp: new Date().toISOString()
        }]
      });
      
      notify('Staff member added successfully');
      
      // Refresh analytics to update staff count
      fetchAnalytics(selectedRestaurant._id);
    } catch (error) {
      console.error("Error adding staff:", error);
      updateDebugInfo({
        lastError: error.message,
        apiCalls: [...debugInfo.apiCalls, {
          endpoint: "/api/staff",
          method: "POST",
          status: "error",
          error: error.message,
          timestamp: new Date().toISOString()
        }]
      });
      notify(error.message, 'error');
    } finally {
      setLoading(prev => ({ ...prev, staff: false }));
    }
  };

  // Delete staff member
  const handleDeleteStaff = async (id) => {
    if (!window.confirm("Are you sure you want to remove this staff member?")) return;

    setLoading(prev => ({ ...prev, staff: true }));
    updateDebugInfo({ lastAction: `Deleting staff member ${id}` });
    
    try {
      console.log("Deleting staff member with ID:", id);
      const response = await fetch("/api/staff", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) throw new Error("Failed to delete staff member");

      setStaff(staff.filter(s => s._id !== id));

      updateDebugInfo({
        apiCalls: [...debugInfo.apiCalls, {
          endpoint: "/api/staff",
          method: "DELETE",
          status: "success",
          data: { id },
          timestamp: new Date().toISOString()
        }]
      });
      
      notify('Staff member removed successfully');
      
      // Refresh analytics to update staff count
      if (selectedRestaurant) {
        fetchAnalytics(selectedRestaurant._id);
      }
    } catch (error) {
      console.error("Error deleting staff:", error);
      updateDebugInfo({
        lastError: error.message,
        apiCalls: [...debugInfo.apiCalls, {
          endpoint: "/api/staff",
          method: "DELETE",
          status: "error",
          error: error.message,
          timestamp: new Date().toISOString()
        }]
      });
      notify(error.message, 'error');
    } finally {
      setLoading(prev => ({ ...prev, staff: false }));
    }
  };

  // Fetch all restaurants
  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(prev => ({ ...prev, restaurants: true }));
      updateDebugInfo({ lastAction: "Fetching restaurants" });
      
      try {
        console.log("Starting restaurants fetch...");
        const response = await fetch("/api/restaurants", { cache: "no-store" });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch restaurants");
        }

        const data = await response.json();
        console.log("Restaurants fetched successfully:", data);
        
        setRestaurants(data);
        setFilteredRestaurants(data);
        updateDebugInfo({
          apiCalls: [...debugInfo.apiCalls, {
            endpoint: "/api/restaurants",
            method: "GET",
            status: "success",
            timestamp: new Date().toISOString()
          }]
        });
        
        notify('Restaurants loaded successfully');
        
        // Fetch global analytics and users data
        fetchUsers();
        fetchStaff();
        fetchOrders();
      } catch (error) {
        console.error("Restaurants fetch error:", error);
        updateDebugInfo({
          lastError: error.message,
          apiCalls: [...debugInfo.apiCalls, {
            endpoint: "/api/restaurants",
            method: "GET",
            status: "error",
            error: error.message,
            timestamp: new Date().toISOString()
          }]
        });
        notify(error.message, 'error');
      } finally {
        setLoading(prev => ({ ...prev, restaurants: false }));
      }
    };

    fetchRestaurants();
  }, []);

  // Update analytics when users, staff, or orders change
  useEffect(() => {
    if (users.length > 0 || staff.length > 0 || orders.length > 0) {
      const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
      const deliveredOrders = orders.filter(order => order.status === 'delivered').length;
      
      setAnalytics(prev => ({
        ...prev,
        totalRevenue,
        totalOrders: orders.length,
        deliveredOrders,
        totalUsers: users.length,
        totalStaff: staff.length,
        recentOrders: orders.slice(0, 5)
      }));
    }
  }, [users, staff, orders]);

  // Fetch restaurant-specific data when selected
  useEffect(() => {
    if (!selectedRestaurant || !selectedRestaurant._id) {
      console.log("No restaurant selected or invalid ID");
      return;
    }

    console.log(`Fetching data for restaurant: ${selectedRestaurant._id}`);
    updateDebugInfo({ lastAction: `Fetching data for restaurant ${selectedRestaurant._id}` });

    const fetchRestaurantData = async () => {
      try {
        // Fetch categories
        setLoading(prev => ({ ...prev, categories: true }));
        console.log("Fetching categories...");
        
        const categoriesRes = await fetch(`/api/categories?restaurantId=${selectedRestaurant._id}`);
        
        if (!categoriesRes.ok) {
          const errorData = await categoriesRes.json();
          throw new Error(errorData.error || "Failed to fetch categories");
        }

        const categoriesData = await categoriesRes.json();
        console.log("Categories fetched:", categoriesData);
        setCategories(categoriesData);
        updateDebugInfo({
          apiCalls: [...debugInfo.apiCalls, {
            endpoint: "/api/categories",
            method: "GET",
            status: "success",
            timestamp: new Date().toISOString()
          }]
        });

        // Fetch restaurant-specific analytics, staff, and orders
        fetchStaff(selectedRestaurant._id);
        fetchOrders(selectedRestaurant._id);

        // Fetch items if on regular tab
        if (activeTab === "regular") {
          setLoading(prev => ({ ...prev, items: true }));
          console.log("Fetching items...");
          
          // Use first category if available
          const categoryParam = categoriesData.length > 0 
            ? `&category=${encodeURIComponent(categoriesData[0].name)}` 
            : '';
            
          const itemsRes = await fetch(
            `/api/items?restaurantId=${selectedRestaurant._id}${categoryParam}`
          );

          if (!itemsRes.ok) {
            const errorData = await itemsRes.json();
            throw new Error(errorData.error || "Failed to fetch items");
          }

          const itemsData = await itemsRes.json();
          console.log("Items fetched:", itemsData);
          setItems(itemsData);
          updateDebugInfo({
            apiCalls: [...debugInfo.apiCalls, {
              endpoint: "/api/items",
              method: "GET",
              status: "success",
              timestamp: new Date().toISOString()
            }]
          });
        }

        // Fetch specials if on special tab
        if (activeTab === "special") {
          setLoading(prev => ({ ...prev, specials: true }));
          console.log("Fetching specials...");
          
          const specialsRes = await fetch(`/api/specials?restaurantId=${selectedRestaurant._id}`);
          
          if (!specialsRes.ok) {
            const errorData = await specialsRes.json();
            throw new Error(errorData.error || "Failed to fetch specials");
          }

          const specialsData = await specialsRes.json();
          console.log("Specials fetched:", specialsData);
          setSpecials(specialsData);
          updateDebugInfo({
            apiCalls: [...debugInfo.apiCalls, {
              endpoint: "/api/specials",
              method: "GET",
              status: "success",
              timestamp: new Date().toISOString()
            }]
          });
        }

        // Fetch tables if on tables tab
        if (activeTab === "tables") {
          setLoading(prev => ({ ...prev, tables: true }));
          console.log("Fetching tables...");
          
          const tablesRes = await fetch(`/api/tables?restaurantId=${selectedRestaurant._id}`);
          
          if (!tablesRes.ok) {
            const errorData = await tablesRes.json();
            throw new Error(errorData.error || "Failed to fetch tables");
          }

          const tablesData = await tablesRes.json();
          console.log("Tables fetched:", tablesData);
          setTables(tablesData);
          updateDebugInfo({
            apiCalls: [...debugInfo.apiCalls, {
              endpoint: "/api/tables",
              method: "GET",
              status: "success",
              timestamp: new Date().toISOString()
            }]
          });
        }

      } catch (error) {
        console.error("Restaurant data fetch error:", error);
        updateDebugInfo({
          lastError: error.message,
          apiCalls: [...debugInfo.apiCalls, {
            endpoint: window.location.pathname,
            method: "GET",
            status: "error",
            error: error.message,
            timestamp: new Date().toISOString()
          }]
        });
        notify(error.message, 'error');
      } finally {
        setLoading(prev => ({
          ...prev,
          categories: false,
          items: activeTab === "regular" ? false : prev.items,
          specials: activeTab === "special" ? false : prev.specials,
          tables: activeTab === "tables" ? false : prev.tables
        }));
      }
    };

    fetchRestaurantData();
  }, [selectedRestaurant, activeTab]);

  // Filter restaurants based on search query
  useEffect(() => {
    console.log("Filtering restaurants with query:", searchQuery);
    const filtered = restaurants.filter(restaurant =>
      restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredRestaurants(filtered);
    updateDebugInfo({ lastAction: `Filtered restaurants with query: ${searchQuery}` });
  }, [searchQuery, restaurants]);

  // Add new restaurant
  const handleAddRestaurant = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, main: true }));
    updateDebugInfo({ lastAction: "Adding new restaurant" });
    
    try {
      console.log("Adding restaurant with data:", newRestaurant);
      const response = await fetch("/api/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRestaurant),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add restaurant");
      }

      const data = await response.json();
      console.log("Restaurant added successfully:", data);
      
      setRestaurants([...restaurants, data]);
      setFilteredRestaurants([...restaurants, data]);
      setNewRestaurant({ name: "", slug: "", image: "" });
      
      updateDebugInfo({
        apiCalls: [...debugInfo.apiCalls, {
          endpoint: "/api/restaurants",
          method: "POST",
          status: "success",
          data: newRestaurant,
          timestamp: new Date().toISOString()
        }]
      });
      
      notify('Restaurant added successfully');
    } catch (error) {
      console.error("Error adding restaurant:", error);
      updateDebugInfo({
        lastError: error.message,
        apiCalls: [...debugInfo.apiCalls, {
          endpoint: "/api/restaurants",
          method: "POST",
          status: "error",
          error: error.message,
          timestamp: new Date().toISOString()
        }]
      });
      notify(error.message, 'error');
    } finally {
      setLoading(prev => ({ ...prev, main: false }));
    }
  };

  // Delete restaurant
  const handleDeleteRestaurant = async (id) => {
    if (!window.confirm("Are you sure you want to delete this restaurant? This action cannot be undone.")) return;

    setLoading(prev => ({ ...prev, restaurants: true }));
    updateDebugInfo({ lastAction: `Deleting restaurant ${id}` });
    
    try {
      console.log("Deleting restaurant with ID:", id);
      const response = await fetch("/api/restaurants", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) throw new Error("Failed to delete restaurant");

      const updatedRestaurants = restaurants.filter(r => r._id !== id);
      setRestaurants(updatedRestaurants);
      setFilteredRestaurants(updatedRestaurants);

      if (selectedRestaurant?._id === id) {
        setSelectedRestaurant(null);
      }

      updateDebugInfo({
        apiCalls: [...debugInfo.apiCalls, {
          endpoint: "/api/restaurants",
          method: "DELETE",
          status: "success",
          data: { id },
          timestamp: new Date().toISOString()
        }]
      });
      
      notify('Restaurant deleted successfully');
    } catch (error) {
      console.error("Error deleting restaurant:", error);
      updateDebugInfo({
        lastError: error.message,
        apiCalls: [...debugInfo.apiCalls, {
          endpoint: "/api/restaurants",
          method: "DELETE",
          status: "error",
          error: error.message,
          timestamp: new Date().toISOString()
        }]
      });
      notify(error.message, 'error');
    } finally {
      setLoading(prev => ({ ...prev, restaurants: false }));
    }
  };

  // Refresh current tab data
  const refreshData = () => {
    if (!selectedRestaurant && activeTab !== "overview") {
      console.log("Cannot refresh - no restaurant selected");
      notify('Please select a restaurant first', 'error');
      return;
    }

    console.log(`Refreshing data for ${activeTab} tab`);
    updateDebugInfo({ lastAction: `Refreshing ${activeTab} data` });

    const fetchData = async () => {
      try {
        if (activeTab === "overview") {
          // Refresh analytics, users, staff, and orders data
          fetchUsers();
          fetchStaff(selectedRestaurant?._id);
          fetchOrders(selectedRestaurant?._id);
          return;
        }

        setLoading(prev => ({ ...prev, [activeTab]: true }));
        let url = '';
        let endpoint = '';

        if (activeTab === "regular") {
          // Use the first category if available
          const category = categories.length > 0 ? categories[0].name : '';
          url = `/api/items?restaurantId=${selectedRestaurant._id}&category=${encodeURIComponent(category)}`;
          endpoint = "/api/items";
        } else if (activeTab === "special") {
          url = `/api/specials?restaurantId=${selectedRestaurant._id}`;
          endpoint = "/api/specials";
        } else if (activeTab === "tables") {
          url = `/api/tables?restaurantId=${selectedRestaurant._id}`;
          endpoint = "/api/tables";
        } else if (activeTab === "staff") {
          fetchStaff(selectedRestaurant._id);
          return;
        }

        console.log(`Fetching from ${url}`);
        const response = await fetch(url);
        
        if (!response.ok) throw new Error(`Failed to refresh ${activeTab}`);

        const data = await response.json();
        console.log(`Refreshed ${activeTab} data:`, data);

        if (activeTab === "regular") setItems(data);
        else if (activeTab === "special") setSpecials(data);
        else if (activeTab === "tables") setTables(data);

        updateDebugInfo({
          apiCalls: [...debugInfo.apiCalls, {
            endpoint,
            method: "GET",
            status: "success",
            timestamp: new Date().toISOString()
          }]
        });
        
        notify(`${activeTab} data refreshed`);
      } catch (error) {
        console.error("Refresh error:", error);
        updateDebugInfo({
          lastError: error.message,
          apiCalls: [...debugInfo.apiCalls, {
            endpoint: window.location.pathname,
            method: "GET",
            status: "error",
            error: error.message,
            timestamp: new Date().toISOString()
          }]
        });
        notify(error.message, 'error');
      } finally {
        setLoading(prev => ({ ...prev, [activeTab]: false }));
      }
    };

    fetchData();
  };
  const fetchAllDeliveredOrders = async (restaurantId = null) => {
  setLoading(prev => ({ ...prev, orders: true }));
  
  try {
    // Fetch current delivered orders
    const currentOrdersUrl = restaurantId 
      ? `/api/orders?restaurantId=${restaurantId}&status=delivered` 
      : "/api/orders?status=delivered";
    
    // Fetch historical delivered orders
    const historyUrl = restaurantId
      ? `/api/order-history?restaurantId=${restaurantId}`
      : "/api/order-history";
    
    // Fetch both in parallel
    const [currentResponse, historyResponse] = await Promise.all([
      fetch(currentOrdersUrl, { cache: "no-store" }),
      fetch(historyUrl, { cache: "no-store" })
    ]);

    if (!currentResponse.ok || !historyResponse.ok) {
      throw new Error("Failed to fetch orders from one or more sources");
    }

    const currentData = await currentResponse.json();
    const historyData = await historyResponse.json();

    // Normalize both responses
    const currentOrders = normalizeOrdersResponse(currentData);
    const historicalOrders = normalizeOrdersResponse(historyData);

    // Combine all delivered orders
    const allDeliveredOrders = [
      ...currentOrders.filter(o => o.status === 'Delivered' || o.status === 'delivered'),
      ...historicalOrders
    ];

    // Calculate totals
    const totalDeliveredOrders = allDeliveredOrders.length;
    const totalRevenueFromDelivered = allDeliveredOrders.reduce(
      (sum, order) => sum + (order.totalPrice || 0), 0
    );

    // Update state
    setAnalytics(prev => ({
      ...prev,
      totalRevenue: totalRevenueFromDelivered,
      deliveredOrders: totalDeliveredOrders,
      totalOrders: prev.totalOrders, // Keep other order counts
      recentOrders: allDeliveredOrders
        .sort((a, b) => new Date(b.deliveredAt || b.updatedAt) - new Date(a.deliveredAt || a.updatedAt))
        .slice(0, 5)
    }));

    setOrders(allDeliveredOrders);

  } catch (error) {
    console.error("Order fetch error:", error);
    notify(`Order tracking error: ${error.message}`, 'error');
  } finally {
    setLoading(prev => ({ ...prev, orders: false }));
  }
};

  // Analytics Overview Component
  const AnalyticsOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Revenue</p>
              <p className="text-2xl font-bold">Rs {analytics.totalRevenue?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="p-3 bg-blue-400 bg-opacity-30 rounded-full">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Orders</p>
              <p className="text-2xl font-bold">{analytics.totalOrders || 0}</p>
            </div>
                        <div className="p-3 bg-green-400 bg-opacity-30 rounded-full">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Delivered Orders</p>
              <p className="text-2xl font-bold">{analytics.deliveredOrders || 0}</p>
            </div>
            <div className="p-3 bg-purple-400 bg-opacity-30 rounded-full">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Registered Users</p>
              <p className="text-2xl font-bold">{analytics.totalUsers || 0}</p>
            </div>
            <div className="p-3 bg-yellow-400 bg-opacity-30 rounded-full">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Management Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Staff Management</h2>
          <button 
            onClick={() => setActiveTab("staff")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Manage Staff
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Staff Summary Card */}
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-800 text-sm font-medium">Total Staff Members</p>
                <p className="text-2xl font-bold text-blue-900">{analytics.totalStaff || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Add Staff Form */}
          <div className="md:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Add New Staff Member</h3>
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({...newStaff, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="waiter">Waiter</option>
                    <option value="chef">Chef</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading.staff}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading.staff ? 'Adding...' : 'Add Staff Member'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  // Staff Management Tab
  const StaffManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Staff Members</h2>
        <button 
          onClick={() => setActiveTab("overview")}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
        >
          Back to Overview
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Current Staff</h3>
          {staff.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {staff.map((staffMember) => (
                    <tr key={staffMember._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{staffMember.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staffMember.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staffMember.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{staffMember.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => handleDeleteStaff(staffMember._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No staff members found.</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-gray-900">Smart Dining Hub - Admin Dashboard</h1>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Restaurant Selection and Search */}
        <div className="mb-6 bg-white rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Restaurants
              </label>
              <input
                type="text"
                id="search"
                placeholder="Search by name or slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={refreshData}
                disabled={loading.main}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading.main ? 'Refreshing...' : 'Refresh Data'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Restaurant
              </label>
              <select
                value={selectedRestaurant?._id || ''}
                onChange={(e) => {
                  const selected = restaurants.find(r => r._id === e.target.value);
                  setSelectedRestaurant(selected || null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select a Restaurant --</option>
                {filteredRestaurants.map((restaurant) => (
                  <option key={restaurant._id} value={restaurant._id}>
                    {restaurant.name} ({restaurant.slug})
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Add New Restaurant</h3>
              <form onSubmit={handleAddRestaurant} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={newRestaurant.name}
                  onChange={(e) => setNewRestaurant({...newRestaurant, name: e.target.value})}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Slug"
                  value={newRestaurant.slug}
                  onChange={(e) => setNewRestaurant({...newRestaurant, slug: e.target.value})}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="submit"
                  disabled={loading.main}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50"
                >
                  Add
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-4" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === "overview" ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("regular")}
              disabled={!selectedRestaurant}
              className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === "regular" ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'} ${!selectedRestaurant ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Regular Menu
            </button>
            <button
              onClick={() => setActiveTab("special")}
              disabled={!selectedRestaurant}
              className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === "special" ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'} ${!selectedRestaurant ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Special Dishes
            </button>
            <button
              onClick={() => setActiveTab("tables")}
              disabled={!selectedRestaurant}
              className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === "tables" ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'} ${!selectedRestaurant ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Tables
            </button>
            <button
              onClick={() => setActiveTab("staff")}
              disabled={!selectedRestaurant}
              className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === "staff" ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'} ${!selectedRestaurant ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Staff Management
            </button>
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-lg shadow p-6">
          {loading.main ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : activeTab === "overview" ? (
            <AnalyticsOverview />
          ) : activeTab === "staff" ? (
            <StaffManagement />
          ) : activeTab === "regular" && selectedRestaurant ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Regular Menu Items</h2>
                <div className="flex gap-2">
                  <CategoryForm 
                    restaurantId={selectedRestaurant._id} 
                    onSuccess={() => {
                      fetchCategories(selectedRestaurant._id);
                      notify('Category added successfully');
                    }} 
                  />
                  <ItemForm 
                    restaurantId={selectedRestaurant._id} 
                    categories={categories} 
                    onSuccess={() => {
                      fetchItems(selectedRestaurant._id);
                      notify('Item added successfully');
                    }} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1">
                  <CategoryList 
                    categories={categories} 
                    restaurantId={selectedRestaurant._id} 
                    onDelete={() => {
                      fetchCategories(selectedRestaurant._id);
                      fetchItems(selectedRestaurant._id);
                      notify('Category deleted successfully');
                    }} 
                    onSelectCategory={(category) => {
                      fetchItems(selectedRestaurant._id, category);
                    }}
                  />
                </div>
                <div className="md:col-span-3">
                  <ItemList 
                    items={items} 
                    restaurantId={selectedRestaurant._id} 
                    onDelete={() => {
                      fetchItems(selectedRestaurant._id);
                      notify('Item deleted successfully');
                    }} 
                  />
                </div>
              </div>
            </div>
          ) : activeTab === "special" && selectedRestaurant ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Special Dishes</h2>
                <SpecialDishForm 
                  restaurantId={selectedRestaurant._id} 
                  onSuccess={() => {
                    fetchSpecials(selectedRestaurant._id);
                    notify('Special dish added successfully');
                  }} 
                />
              </div>
              <SpecialsList 
                specials={specials} 
                restaurantId={selectedRestaurant._id} 
                onDelete={() => {
                  fetchSpecials(selectedRestaurant._id);
                  notify('Special dish deleted successfully');
                }} 
              />
            </div>
          ) : activeTab === "tables" && selectedRestaurant ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Tables Management</h2>
                <TableForm 
                  restaurantId={selectedRestaurant._id} 
                  selectedRestaurant={selectedRestaurant}
                  onSuccess={() => {
                    fetchTables(selectedRestaurant._id);
                    notify('Table added successfully');
                  }} 
                />
              </div>
              <TableList 
                tables={tables} 
                restaurantId={selectedRestaurant._id} 
                onDelete={() => {
                  fetchTables(selectedRestaurant._id);
                  notify('Table deleted successfully');
                }} 
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {selectedRestaurant ? "Please select a tab to continue" : "Please select a restaurant to continue"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}