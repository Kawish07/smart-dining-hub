// components/SpecialDishForm.jsx
"use client";
import { useState } from "react";
import { ChefHat, Clock, Award } from "lucide-react";

export default function SpecialDishForm({ restaurantId, onAddSpecial, categories }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [specialDish, setSpecialDish] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
    prepTime: "",
    isNew: false,
    chefRecommended: false,
    awardWinning: false,
    isActive: true,
    tags: [],
    categoryId: ""
  });
  const [tag, setTag] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSpecialDish({
      ...specialDish,
      [name]: type === "checkbox" ? checked : value
    });
    setSuccess(false);
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    if (tag.trim() && !specialDish.tags.includes(tag.trim())) {
      setSpecialDish({
        ...specialDish,
        tags: [...specialDish.tags, tag.trim()]
      });
      setTag("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setSpecialDish({
      ...specialDish,
      tags: specialDish.tags.filter(t => t !== tagToRemove)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
  
    try {
      // Validate and prepare data
      const specialToSubmit = {
        ...specialDish,
        restaurantId,
        price: parseFloat(specialDish.price),
        prepTime: specialDish.prepTime ? parseInt(specialDish.prepTime) : null,
      };
  
      // Send request
      const response = await fetch("/api/specials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(specialToSubmit),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add special dish");
      }
  
      const data = await response.json();
      console.log("Special Dish Added:", data); // Log the response
  
      // Reset form
      setSpecialDish({
        name: "",
        description: "",
        price: "",
        image: "",
        prepTime: "",
        isNew: false,
        chefRecommended: false,
        awardWinning: false,
        isActive: true,
        tags: [],
        categoryId: "",
      });
      setSuccess(true);
  
      // Call the onAddSpecial callback
      if (typeof onAddSpecial === "function") {
        onAddSpecial();
      }
    } catch (error) {
      console.error("Error adding special dish:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4 text-red-700 flex items-center">
        <ChefHat className="mr-2" /> Add Special Dish
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          Special dish added successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dish Name*
            </label>
            <input
              type="text"
              name="name"
              value={specialDish.name}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price ($)*
            </label>
            <input
              type="text"
              name="price"
              value={specialDish.price}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image URL
            </label>
            <input
              type="text"
              name="image"
              value={specialDish.image}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preparation Time (minutes)
            </label>
            <input
              type="text"
              name="prepTime"
              value={specialDish.prepTime}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category (Optional)
            </label>
            <select
              name="categoryId"
              value={specialDish.categoryId}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Select Category --</option>
              {categories?.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description*
            </label>
            <textarea
              name="description"
              value={specialDish.description}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              rows="3"
              required
            ></textarea>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <div className="flex items-center">
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="flex-1 p-2 border rounded-l"
                placeholder="e.g. spicy, vegetarian, etc."
              />
              <button
                onClick={handleAddTag}
                type="button"
                className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap mt-2 gap-2">
              {specialDish.tags.map((t, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-200 text-gray-800 text-sm rounded-full flex items-center"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="ml-1 text-gray-600 hover:text-gray-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 flex flex-wrap gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="isNew"
                checked={specialDish.isNew}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">New Dish</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="chefRecommended"
                checked={specialDish.chefRecommended}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Chef Recommended</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="awardWinning"
                checked={specialDish.awardWinning}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Award Winning</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="isActive"
                checked={specialDish.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center"
          disabled={loading}
        >
          <ChefHat className="mr-2" size={18} />
          {loading ? "Adding..." : "Add Special Dish"}
        </button>
      </form>
    </div>
  );
}