// Updated CategoryList.js
"use client";
import Link from "next/link";

export default function CategoryList({ restaurantId, categories = [], loading, onDeleteCategory }) {
  if (!restaurantId) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-red-500">Restaurant information is incomplete</p>
      </div>
    );
  }

  const handleDelete = async (categoryId) => {
    try {
      const response = await fetch("/api/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: categoryId, restaurantId }),
      });

      if (!response.ok) throw new Error("Failed to delete category");
      onDeleteCategory(categoryId);
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  return (
    <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">Categories</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {categories.map((category) => (
          <div key={category._id} className="bg-gray-50 p-4 rounded-lg shadow-sm">
            <Link
              href={`#`}
              className="block hover:text-blue-600"
            >
              <h3 className="text-lg font-medium">{category.name}</h3>
            </Link>
            <button
              onClick={() => handleDelete(category._id)}
              className="text-red-500 mt-2 hover:text-red-600 text-sm"
            >
              Delete Category
            </button>
          </div>
        ))}
        {categories.length === 0 && !loading && (
          <div className="col-span-full text-center text-gray-500">No categories found.</div>
        )}
      </div>
    </div>
  );
}

// Ensure you're passing restaurantId and not full restaurant object