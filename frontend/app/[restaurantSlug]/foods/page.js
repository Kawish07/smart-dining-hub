"use client";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function CategoryPage() {
  const params = useParams();
  const { category, restaurantSlug } = params;
  const [items, setItems] = useState([]);

  console.log("Category:", category); // Log the category
  console.log("Restaurant Slug:", restaurantSlug); // Log the restaurant slug

  const fetchItems = async () => {
    try {
      // Step 1: Fetch the restaurantId using the slug
      const restaurantResponse = await fetch(`/api/restaurants?slug=${restaurantSlug}`);
      if (!restaurantResponse.ok) {
        throw new Error("Failed to fetch restaurant details");
      }
      const restaurantData = await restaurantResponse.json();
      const restaurantId = restaurantData._id; // Ensure this is the correct field for the ObjectId

      // Step 2: Fetch items using the correct restaurantId
      const categoryParam = category || ""; // Handle empty category
      const response = await fetch(
        `/api/items?category=${categoryParam}&restaurantId=${restaurantId}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        console.error("Response status:", response.status);
        console.error("Response status text:", response.statusText);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched items:", data); // Log the fetched items
      setItems(data);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [category, restaurantSlug]);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">{category}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item._id} className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-bold">{item.name}</h2>
            <p>Rs.{item.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}