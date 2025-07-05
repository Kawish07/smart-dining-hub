// components/SpecialsList.jsx
"use client";
import { useState } from "react";
import { ChefHat, Trash2, Edit, Clock, Award, Check, X } from "lucide-react";

export default function SpecialsList({ restaurantId, specials, onDeleteSpecial }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
  
    const handleDeleteSpecial = async (specialId) => {
      if (!window.confirm("Are you sure you want to delete this special dish?")) {
        return;
      }
  
      setLoading(true);
      setError(null);
  
      try {
        const response = await fetch(`/api/specials/${specialId}`, {
          method: "DELETE",
        });
  
        if (!response.ok) {
          throw new Error("Failed to delete special dish");
        }
  
        if (typeof onDeleteSpecial === "function") {
          onDeleteSpecial();
        }
      } catch (error) {
        console.error("Error deleting special dish:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
  
    if (!specials || specials.length === 0) {
      return (
        <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-red-700 flex items-center">
            <ChefHat className="mr-2" /> Special Dishes
          </h2>
          <p className="text-gray-500 italic">No special dishes found.</p>
        </div>
      );
    }
  
    return (
      <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 text-red-700 flex items-center">
          <ChefHat className="mr-2" /> Special Dishes
        </h2>
  
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
  
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dish
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tags
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {specials.map((special) => {
                if (!special) return null; // Skip undefined items
                return (
                  <tr key={special._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {special?.image ? (
                          <img
                            src={special.image}
                            alt={special.name}
                            className="h-10 w-10 rounded-full object-cover mr-3"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                            <ChefHat size={16} className="text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">
                            {special.name}
                            {special.isNew && (
                              <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
                                NEW
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 max-w-md truncate">
                            {special.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${special.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {special.tags && special.tags.length > 0 ? (
                          special.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs">No tags</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            special.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {special.isActive ? (
                            <Check size={12} className="mr-1" />
                          ) : (
                            <X size={12} className="mr-1" />
                          )}
                          {special.isActive ? "Active" : "Inactive"}
                        </span>
                        {special.chefRecommended && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <ChefHat size={12} className="mr-1" />
                            Chef's Pick
                          </span>
                        )}
                        {special.awardWinning && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            <Award size={12} className="mr-1" />
                            Award Winner
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        className="text-red-600 hover:text-red-900 ml-4"
                        onClick={() => handleDeleteSpecial(special._id)}
                        disabled={loading}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }