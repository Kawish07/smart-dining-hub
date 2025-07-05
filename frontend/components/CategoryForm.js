// components/CategoryForm.js
"use client";
import { useState, useEffect } from "react";
import { toast } from 'react-toastify';

export default function CategoryForm({ restaurantId, onAddCategory }) {
  const [categoryName, setCategoryName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Enhanced debug logging
  useEffect(() => {
    console.log("CategoryForm mounted with restaurantId:", restaurantId);
    if (!restaurantId) {
      console.warn("No restaurantId provided to CategoryForm");
    }
  }, [restaurantId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log("Attempting to submit category with:", {
      name: categoryName,
      restaurantId: restaurantId
    });
    
    if (!categoryName.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }

    if (!restaurantId) {
      console.error("Submission blocked - no restaurantId");
      toast.error("Please select a restaurant first");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: categoryName,
          restaurantId: restaurantId  // Make sure this is passed as a string
        }),
      });

      const data = await response.json();
      console.log("API Response:", data);
      
      if (!response.ok) {
        console.error("API Error:", data.error || 'Failed to create category');
        throw new Error(data.error || 'Failed to create category');
      }

      onAddCategory(data);
      setCategoryName('');
      toast.success('Category created successfully');
    } catch (error) {
      console.error('Category creation failed:', error);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">Add New Category</h2>
      <div className="flex gap-2">
        <input
          type="text"
          value={categoryName}
          onChange={(e) => {
            console.log("Category name updated:", e.target.value);
            setCategoryName(e.target.value);
          }}
          className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter category name"
          required
        />
        <button
          type="submit"
          disabled={isSubmitting || !restaurantId}
          className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 
            ${isSubmitting || !restaurantId ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Adding...
            </span>
          ) : 'Add Category'}
        </button>
      </div>
      {!restaurantId && (
        <p className="mt-2 text-sm text-red-600">
          <svg className="inline mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Please select a restaurant first
        </p>
      )}
    </form>
  );
}