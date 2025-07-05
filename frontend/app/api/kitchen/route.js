import { NextResponse } from "next/server";
import connectToDb from "@/lib/mongodb";
import Order from "@/models/Order";

export async function GET(request) {
  try {
    await connectToDb(); // Ensure database connection

    // Fetch all orders with status other than "Completed" - including all payment statuses
    const orders = await Order.find({ 
      status: { $ne: "Completed" } 
    }).select('_id orderNumber userId items totalPrice createdAt status kitchenStatus paymentStatus paymentConfirmedAt') // Include paymentStatus
    .sort({
      createdAt: -1,
    });

    return NextResponse.json({ 
      orders: orders.map(order => ({
        _id: order._id.toString(),
        orderNumber: order.orderNumber,
        userId: order.userId,
        items: order.items,
        totalPrice: order.totalPrice,
        createdAt: order.createdAt,
        status: order.status,
        kitchenStatus: order.kitchenStatus,
        paymentStatus: order.paymentStatus || 'pending', // Include payment status
        paymentConfirmedAt: order.paymentConfirmedAt
      }))
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch orders",
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}

// Updated PATCH method for updating payment status and other fields
export async function PATCH(request) {
  try {
    await connectToDb();

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    
    const body = await request.json();
    const { status, kitchenStatus, paymentStatus, kitchenHidden } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" }, 
        { status: 400 }
      );
    }

    const updateData = {};
    
    // Handle different update types
    if (status) updateData.status = status;
    if (kitchenStatus) updateData.kitchenStatus = kitchenStatus;
    if (kitchenHidden !== undefined) updateData.kitchenHidden = kitchenHidden;
    
    // Handle payment status updates
    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
      
      // Set payment confirmation timestamp when confirming payment
      if (paymentStatus === 'confirmed') {
        updateData.paymentConfirmedAt = new Date();
        // Optionally also update order status when payment is confirmed
        if (!status) {
          updateData.status = 'Confirmed';
        }
      }
      
      // Clear confirmation timestamp if payment is marked as pending or failed
      if (paymentStatus === 'pending' || paymentStatus === 'failed') {
        updateData.paymentConfirmedAt = null;
        // Optionally revert order status when payment is not confirmed
        if (!status) {
          updateData.status = 'Pending';
        }
      }
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId, 
      updateData, 
      { new: true }
    );

    if (!updatedOrder) {
      return NextResponse.json(
        { error: "Order not found" }, 
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: "Order updated successfully",
      order: {
        _id: updatedOrder._id.toString(),
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        kitchenStatus: updatedOrder.kitchenStatus,
        paymentStatus: updatedOrder.paymentStatus,
        paymentConfirmedAt: updatedOrder.paymentConfirmedAt,
        kitchenHidden: updatedOrder.kitchenHidden
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { 
        error: "Failed to update order",
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}