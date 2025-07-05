// app/api/specials/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb"; // Import your DB connection utility
import Special from "@/models/special"; // We'll create this model next
import mongoose from "mongoose";

// GET handler - Get all specials for a restaurant
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId");
    
    if (!restaurantId) {
      return NextResponse.json(
        { error: "Restaurant ID is required" },
        { status: 400 }
      );
    }

    // Fetch special dishes for the restaurant
    const specialDishes = await Special.find({ 
      restaurantId: restaurantId,
      isActive: true 
    }).sort({ createdAt: -1 });

    return NextResponse.json(specialDishes);
  } catch (error) {
    console.error("Error fetching special dishes:", error);
    return NextResponse.json(
      { error: "Failed to fetch special dishes" },
      { status: 500 }
    );
  }
}

// POST handler - Create a new special dish
// In app/api/specials/route.js
export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    // Clean the categoryId field
    if (body.categoryId === "" || body.categoryId === undefined) {
      body.categoryId = null;
    }

    // Validate categoryId if provided
    if (body.categoryId && !mongoose.Types.ObjectId.isValid(body.categoryId)) {
      return NextResponse.json(
        { error: "Invalid category ID format" },
        { status: 400 }
      );
    }

    // Create the special dish
    const specialDish = new Special(body);
    await specialDish.save();
    console.log("Created dish:", specialDish);
    return NextResponse.json(specialDish, { status: 201 });
  } catch (error) {
    console.error("Error creating special dish:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create special dish" },
      { status: 500 }
    );
  }
}