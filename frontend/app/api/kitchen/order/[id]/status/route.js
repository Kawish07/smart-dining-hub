// app/api/kitchen/order/[id]/status/route.js
import { NextResponse } from "next/server";
import connectToDb from "@/lib/mongodb";
import Order from "@/models/Order";

export async function PATCH(request, { params }) {
  try {
    await connectToDb();
    
    const { id } = params; // Changed from orderId to id
    const { kitchenStatus, status } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id, // Changed from orderId to id
      { kitchenStatus, status },
      { new: true }
    );

    if (!updatedOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      message: "Kitchen status updated successfully",
      order: updatedOrder
    }, { status: 200 });

  } catch (error) {
    console.error("Error updating kitchen status:", error);
    return NextResponse.json(
      { 
        error: "Failed to update kitchen status",
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}