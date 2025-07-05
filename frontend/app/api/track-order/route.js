import { NextResponse } from "next/server";
import connectToDb from "@/lib/mongodb";
import Order from "@/models/Order";
import mongoose from "mongoose";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    let orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    await connectToDb();

    // Clean and validate the order ID
    orderId = orderId.trim();
    
    // Check if it's a valid MongoDB ObjectId
    const isValidObjectId = mongoose.Types.ObjectId.isValid(orderId) && 
                          (new mongoose.Types.ObjectId(orderId)).toString() === orderId;

    let order;
    if (isValidObjectId) {
      order = await Order.findById(orderId);
    } else {
      // Try searching by order number or transaction ID
      order = await Order.findOne({
        $or: [
          { orderNumber: orderId },
          { transactionId: orderId }
        ]
      });
    }

    if (!order) {
      return NextResponse.json(
        { error: "Order not found. Please check your order ID." },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error tracking order:", error);
    return NextResponse.json(
      { error: "Failed to track order", details: error.message },
      { status: 500 }
    );
  }
}