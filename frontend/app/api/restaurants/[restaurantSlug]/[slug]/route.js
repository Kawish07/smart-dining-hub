// app/api/restaurants/slug/[slug]/route.js
import { NextResponse } from "next/server";
import connectToDb from "@/lib/mongodb";
import Restaurant from "@/models/Restaurant";

export async function GET(request, { params }) {
  try {
    await connectToDb();
    
    const restaurant = await Restaurant.findOne({ slug: params.slug })
      .select('_id name slug tables')
      .lean();

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(restaurant);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch restaurant", details: error.message },
      { status: 500 }
    );
  }
}