// components/TableList.js
"use client";
import { useState } from "react";

export default function TableList({ tables, restaurantId, onDelete }) {
  const [error, setError] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  const handleDelete = async (tableId) => {
    if (!window.confirm("Are you sure you want to delete this table?")) return;
    
    setLoadingId(tableId);
    setError(null);
    
    try {
      const response = await fetch("/api/tables", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tableId }) // Changed from tableId to id to match API
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete table");
      }
      
      onDelete(); // Changed to call onDelete without parameter since parent will refetch
    } catch (error) {
      console.error("Error deleting table:", error);
      setError(error.message);
    } finally {
      setLoadingId(null);
    }
  };

  // Status display colors
  const statusColors = {
    available: "bg-green-100 text-green-800",
    occupied: "bg-yellow-100 text-yellow-800",
    reserved: "bg-blue-100 text-blue-800",
    "out-of-service": "bg-red-100 text-red-800"
  };

  return (
    <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">
        {tables.length > 0 ? `Tables (${tables.length})` : "No Tables Found"}
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {tables.length === 0 ? (
        <p className="text-gray-500">No tables have been added yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Table Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tables.map((table) => (
                <tr key={table._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {table.number}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {table.capacity} people
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[table.status]}`}>
                      {table.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleDelete(table._id)}
                      disabled={loadingId === table._id}
                      className="text-red-600 hover:text-red-900 disabled:text-red-300"
                    >
                      {loadingId === table._id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}