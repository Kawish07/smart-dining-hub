import connectToDb from "@/lib/mongodb";
import Order from "@/models/Order";
import { NextResponse } from "next/server";
import mongoose from "mongoose"; // Needed for ObjectId conversion

export async function GET(req, { params }) {
  await connectToDb(); // Ensure DB connection

  const { orderId } = params; // Extract orderId from URL params

  // Validate orderId format
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return NextResponse.json({ error: "Invalid Order ID format." }, { status: 400 });
  }

  try {
    const order = await Order.findById(orderId);
    
    if (!order) {
      return NextResponse.json({ error: "Order not found. Please enter a valid Order ID." }, { status: 404 });
    }

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json({ error: "Failed to fetch order. Please try again later." }, { status: 500 });
  }
}
