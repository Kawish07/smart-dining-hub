"use client";
import { useState } from "react";
import { Edit, Trash2, Plus, Check, X } from "lucide-react";

export default function MenuList({ restaurantId, menus, onDeleteMenu, onUpdateMenu }) {
  const [editingItem, setEditingItem] = useState(null);
  const [editedValues, setEditedValues] = useState({});
  const [newItem, setNewItem] = useState(false);
  const [newItemValues, setNewItemValues] = useState({
    name: "",
    description: "",
    price: "",
    category: ""
  });

  const filteredMenus = menus.filter((menu) => menu.restaurantId === restaurantId);

  const handleEdit = (menuId, category, item) => {
    setEditingItem(`${menuId}-${item.id}`);
    setEditedValues({
      name: item.name,
      description: item.description,
      price: item.price,
      category: category
    });
  };

  const handleSave = async (menuId, itemId) => {
    await onUpdateMenu(restaurantId, editedValues.category, itemId, editedValues);
    setEditingItem(null);
  };

  const handleCancel = () => {
    setEditingItem(null);
    setEditedValues({});
  };

  const handleAddItem = async () => {
    if (!newItemValues.name || !newItemValues.price || !newItemValues.category) return;
    
    const newItem = {
      id: Date.now().toString(),
      ...newItemValues,
      price: parseFloat(newItemValues.price)
    };

    await onUpdateMenu(restaurantId, newItemValues.category, newItem.id, newItem, true);
    setNewItem(false);
    setNewItemValues({
      name: "",
      description: "",
      price: "",
      category: ""
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-700">Menu Management</h2>
        <button
          onClick={() => setNewItem(true)}
          className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} /> Add Item
        </button>
      </div>

      {/* Add New Item Form */}
      {newItem && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
          <h3 className="font-medium text-gray-800 mb-3">Add New Menu Item</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                value={newItemValues.category}
                onChange={(e) => setNewItemValues({...newItemValues, category: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Category name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
              <input
                type="text"
                value={newItemValues.name}
                onChange={(e) => setNewItemValues({...newItemValues, name: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Item name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={newItemValues.description}
                onChange={(e) => setNewItemValues({...newItemValues, description: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
              <input
                type="number"
                value={newItemValues.price}
                onChange={(e) => setNewItemValues({...newItemValues, price: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => setNewItem(false)}
              className="px-3 py-1.5 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddItem}
              className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Add Item
            </button>
          </div>
        </div>
      )}

      {/* Menu List */}
      <div className="space-y-6">
        {filteredMenus.map((menu) => (
          <div key={menu._id} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{menu.category}</h3>
            {menu.items.map((item) => (
              <div key={item.id} className="ml-4 mt-3 p-3 bg-white rounded-md border border-gray-100">
                {editingItem === `${menu._id}-${item.id}` ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={editedValues.name}
                        onChange={(e) => setEditedValues({...editedValues, name: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <input
                        type="text"
                        value={editedValues.category}
                        onChange={(e) => setEditedValues({...editedValues, category: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <input
                        type="text"
                        value={editedValues.description}
                        onChange={(e) => setEditedValues({...editedValues, description: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                      <input
                        type="number"
                        value={editedValues.price}
                        onChange={(e) => setEditedValues({...editedValues, price: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <div className="flex justify-end gap-2 col-span-2">
                      <button
                        onClick={handleCancel}
                        className="px-3 py-1 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                      >
                        <X size={16} />
                      </button>
                      <button
                        onClick={() => handleSave(menu._id, item.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <Check size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-800 font-medium">{item.name}</p>
                      {item.description && (
                        <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                      )}
                      <p className="text-gray-600 mt-1">${item.price.toFixed(2)}</p>
                      <span className="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded mt-1">
                        {menu.category}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(menu._id, menu.category, item)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => onDeleteMenu(restaurantId, menu.category, item.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}