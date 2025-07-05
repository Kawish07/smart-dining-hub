"use client";

export default function ItemList({ restaurantId, items, onDeleteItem }) {
  const handleDeleteItem = async (itemId) => {
    const confirmDelete = confirm("Are you sure you want to delete this item?");
    if (!confirmDelete) return;

    try {
      const response = await fetch('/api/items', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId })
      });

      const result = await response.json();

      if (response.ok) {
        alert("Item deleted successfully");
        // Optionally re-fetch or update state to reflect deletion
      } else {
        alert("Failed to delete item: " + result.error);
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("An error occurred while deleting the item.");
    }
  };

  return (
    <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">Items</h2>
      <div className="space-y-4">
        {items
          .filter((item) => item.restaurantId === restaurantId) // Filter by restaurantId
          .map((item) => (
            <div key={item._id} className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <p className="text-gray-800">{item.name}</p>
              <p className="text-gray-600">${item.price}</p>
              <button
                className="text-red-500 hover:text-red-700"
                onClick={() => handleDeleteItem(item._id)}
              >
                Delete
              </button>

            </div>
          ))}
      </div>
    </div>
  );
}