"use client";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

export default function TableForm({ restaurantId, selectedRestaurant, onSuccess }) {
  const [tableData, setTableData] = useState({
    number: "",
    size: "medium", // Added default size
    capacity: 4,
    description: "",
    restaurantId: restaurantId || "",
    restaurantName: selectedRestaurant?.name || "",
    restaurantSlug: selectedRestaurant?.slug || ""
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedRestaurant) {
      setTableData(prev => ({
        ...prev,
        restaurantId: selectedRestaurant._id,
        restaurantName: selectedRestaurant.name,
        restaurantSlug: selectedRestaurant.slug
      }));
    }
  }, [selectedRestaurant]);

  // In your TableForm component
const handleSubmit = async (e) => {
  e.preventDefault();
  
  console.log("Form submitted with data:", tableData); // Debug log
  if (!tableData.number || !tableData.restaurantId || !tableData.restaurantName) {
    console.log("Validation failed - missing fields:", {
      number: tableData.number,
      restaurantId: tableData.restaurantId,
      restaurantName: tableData.restaurantName
    });
    toast.error("Please fill all required fields");
    return;
  }

  setLoading(true);

  try {
    console.log("Sending to API:", {
      number: tableData.number,
      size: tableData.size,
      capacity: tableData.capacity,
      restaurantId: tableData.restaurantId,
      restaurantName: tableData.restaurantName,
      description: tableData.description
    });

    const response = await fetch("/api/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        number: tableData.number,
        size: tableData.size,
        capacity: tableData.capacity,
        restaurantId: tableData.restaurantId,
        restaurantName: tableData.restaurantName,
        description: tableData.description
      })
    });

    console.log("API response status:", response.status); // Debug log

    const data = await response.json();
    console.log("API response data:", data); // Debug log

    if (!response.ok) {
      throw new Error(data.error || "Failed to add table");
    }

    toast.success("Table added successfully!");
    onSuccess(data);
    
    // Reset form
    setTableData({
      number: "",
      size: "medium",
      capacity: 4,
      description: "",
      restaurantId: restaurantId || "",
      restaurantName: selectedRestaurant?.name || "",
      restaurantSlug: selectedRestaurant?.slug || ""
    });

  } catch (error) {
    console.error("Table creation error:", error);
    toast.error(error.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Table Number *
        </label>
        <input
          type="text"
          value={tableData.number}
          onChange={(e) => setTableData({...tableData, number: e.target.value})}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Size *
        </label>
        <select
          value={tableData.size}
          onChange={(e) => setTableData({...tableData, size: e.target.value})}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="small">Small (2-4 people)</option>
          <option value="medium">Medium (4-6 people)</option>
          <option value="large">Large (6+ people)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Capacity *
        </label>
        <input
          type="number"
          min="1"
          max="20"
          value={tableData.capacity}
          onChange={(e) => setTableData({...tableData, capacity: parseInt(e.target.value) || 4})}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          value={tableData.description}
          onChange={(e) => setTableData({...tableData, description: e.target.value})}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          rows={2}
        />
      </div>

      <input type="hidden" name="restaurantId" value={tableData.restaurantId} />
      <input type="hidden" name="restaurantName" value={tableData.restaurantName} />

      <button
        type="submit"
        disabled={loading || !tableData.restaurantId}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Adding..." : "Add Table"}
      </button>
    </form>
  );
}