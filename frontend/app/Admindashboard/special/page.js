// app/(admin)/dashboard/special/page.js
"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChefHat, Trash2, Edit, Save, X, Plus, Image as ImageIcon } from "lucide-react";

export default function SpecialDishesAdmin() {
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [specials, setSpecials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [newSpecial, setNewSpecial] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
    ingredients: "",
    featured: false
  });
  const [editingSpecialId, setEditingSpecialId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  useEffect(() => {
    if (selectedRestaurant) {
      fetchSpecials(selectedRestaurant._id);
    }
  }, [selectedRestaurant]);

  useEffect(() => {
    setFilteredRestaurants(
      restaurants.filter((restaurant) =>
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, restaurants]);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/restaurants", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to fetch restaurants");
      const data = await response.json();
      setRestaurants(data);
      setFilteredRestaurants(data);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecials = async (restaurantId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/specials?restaurantId=${restaurantId}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to fetch special dishes");
      const data = await response.json();
      setSpecials(data);
    } catch (error) {
      console.error("Error fetching specials:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSpecial = async (e) => {
    e.preventDefault();
    
    try {
      const specialData = {
        ...newSpecial,
        restaurantId: selectedRestaurant._id,
        ingredients: newSpecial.ingredients.split(',').map(i => i.trim()),
        price: parseFloat(newSpecial.price),
        // Ensure categoryId is either valid or null
        categoryId: newSpecial.categoryId || null
      };
  
      const response = await fetch("/api/specials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(specialData),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add special dish");
      }
      window.location.reload();
      
      // Handle success...
    } catch (error) {
      console.error("Error adding special dish:", error);
      setError(error.message);
    }

  };

  const handleUpdateSpecial = async (e) => {
    e.preventDefault();
    if (!editingSpecialId) return;

    setLoading(true);
    try {
      const specialData = {
        ...newSpecial,
        ingredients: newSpecial.ingredients.split(',').map(i => i.trim()),
        price: parseFloat(newSpecial.price)
      };

      const response = await fetch(`/api/specials/${editingSpecialId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(specialData),
      });

      if (!response.ok) throw new Error("Failed to update special dish");
      
      // Refresh the specials list
      fetchSpecials(selectedRestaurant._id);
      // Reset editing state
      setEditingSpecialId(null);
      setNewSpecial({
        name: "",
        description: "",
        price: "",
        image: "",
        ingredients: "",
        featured: false
      });
      setShowForm(false);
    } catch (error) {
      console.error("Error updating special dish:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSpecial = async (id) => {
    if (!confirm("Are you sure you want to delete this special dish?")) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/specials/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete special dish");
      
      // Refresh the specials list
      fetchSpecials(selectedRestaurant._id);
    } catch (error) {
      console.error("Error deleting special dish:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const startEditSpecial = (special) => {
    setEditingSpecialId(special._id);
    setNewSpecial({
      name: special.name,
      description: special.description,
      price: special.price.toString(),
      image: special.image,
      ingredients: special.ingredients.join(', '),
      featured: special.featured || false
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingSpecialId(null);
    setNewSpecial({
      name: "",
      description: "",
      price: "",
      image: "",
      ingredients: "",
      featured: false
    });
    setShowForm(false);
  };

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center mb-8">
          <ChefHat className="h-8 w-8 text-amber-500 mr-3" />
          <h1 className="text-3xl font-bold text-gray-800">Chef's Special Dishes</h1>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <X className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Select Restaurant</h2>
          <input
            type="text"
            placeholder="Search for a restaurant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
          />
          <div className="mt-3 max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
            {filteredRestaurants.map((restaurant) => (
              <div
                key={restaurant._id}
                className={`p-3 hover:bg-amber-50 cursor-pointer border-b border-gray-100 transition-colors ${
                  selectedRestaurant?._id === restaurant._id ? "bg-amber-100" : ""
                }`}
                onClick={() => setSelectedRestaurant(restaurant)}
              >
                {restaurant.name}
              </div>
            ))}
          </div>
        </div>

        {selectedRestaurant && (
          <>
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 rounded-t-lg shadow-md">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <span>Managing Specials for:</span>
                <span className="ml-2 bg-white text-amber-600 px-3 py-1 rounded-full text-lg">
                  {selectedRestaurant.name}
                </span>
              </h2>
            </div>

            <div className="bg-white rounded-b-lg shadow-md p-6 mb-8">
              {!showForm ? (
                <motion.button
                  initial={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowForm(true)}
                  className="bg-amber-500 text-white px-5 py-3 rounded-lg shadow-md hover:bg-amber-600 flex items-center justify-center w-full mb-6 transition-all"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add New Special Dish
                </motion.button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-amber-50 p-6 rounded-lg border border-amber-200 mb-6"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-amber-700">
                      {editingSpecialId ? "Edit Special Dish" : "Add New Special Dish"}
                    </h3>
                    <button
                      onClick={cancelEdit}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <form onSubmit={editingSpecialId ? handleUpdateSpecial : handleAddSpecial}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dish Name
                        </label>
                        <input
                          type="text"
                          value={newSpecial.name}
                          onChange={(e) => setNewSpecial({ ...newSpecial, name: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Price ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={newSpecial.price}
                          onChange={(e) => setNewSpecial({ ...newSpecial, price: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Image URL
                      </label>
                      <div className="flex">
                        <input
                          type="text"
                          value={newSpecial.image}
                          onChange={(e) => setNewSpecial({ ...newSpecial, image: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          placeholder="https://example.com/image.jpg"
                        />
                        <div className="bg-gray-100 flex items-center justify-center px-3 border-t border-r border-b border-gray-300 rounded-r-lg">
                          <ImageIcon className="h-5 w-5 text-gray-500" />
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ingredients (comma separated)
                      </label>
                      <input
                        type="text"
                        value={newSpecial.ingredients}
                        onChange={(e) => setNewSpecial({ ...newSpecial, ingredients: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        placeholder="Chicken, spinach, cream sauce"
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={newSpecial.description}
                        onChange={(e) => setNewSpecial({ ...newSpecial, description: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 min-h-32"
                        required
                      />
                    </div>

                    <div className="mb-4 flex items-center">
                      <input
                        type="checkbox"
                        id="featured"
                        checked={newSpecial.featured}
                        onChange={(e) => setNewSpecial({ ...newSpecial, featured: e.target.checked })}
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                      />
                      <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
                        Feature this dish (will appear prominently)
                      </label>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mr-3 hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-amber-500 text-white px-5 py-2 rounded-lg shadow hover:bg-amber-600 transition-colors flex items-center"
                      >
                        {loading ? (
                          "Processing..."
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            {editingSpecialId ? "Update Dish" : "Save Dish"}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              <h3 className="text-xl font-bold text-gray-700 mb-4">Special Dishes</h3>
              
              {specials.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No special dishes added yet.</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Add your first chef's special dish to showcase it to your customers.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {specials.map((special) => (
                    <motion.div
                      key={special._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
                    >
                      <div className="h-48 bg-gray-300 relative">
                        {special.image ? (
                          <img
                            src={special.image}
                            alt={special.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <ImageIcon className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                        {special.featured && (
                          <div className="absolute top-3 right-3 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                            Featured
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h4 className="text-lg font-bold mb-1">{special.name}</h4>
                        <p className="text-amber-600 font-medium mb-2">${special.price.toFixed(2)}</p>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{special.description}</p>
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1">Ingredients:</p>
                          <div className="flex flex-wrap gap-1">
                            {special.ingredients.map((ingredient, index) => (
                              <span 
                                key={index} 
                                className="text-xs bg-gray-100 px-2 py-1 rounded-full"
                              >
                                {ingredient}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2 mt-3">
                          <button
                            onClick={() => startEditSpecial(special)}
                            className="flex items-center text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSpecial(special._id)}
                            className="flex items-center text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}