// app/api/kitchen/order/[id]/route.js
import { NextResponse } from 'next/server';
import connectToDb from "@/lib/mongodb";
import Order from "@/models/Order";

// PATCH: Update order status or kitchen status
export async function PATCH(req, { params }) {
  try {
    // Ensure database connection
    await connectToDb();

    // Extract order ID and request body
    const orderId = params?.id;
    const body = await req.json();
    const { status, kitchenStatus } = body;

    console.log('PATCH Request:', { orderId, status, kitchenStatus });

    if (!orderId) {
      return NextResponse.json(
        { message: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Update the order with new statuses
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        ...(status && { status }),
        ...(kitchenStatus && { kitchenStatus }),
      },
      { new: true }
    );

    if (!updatedOrder) {
      return NextResponse.json(
        { message: 'Order not found' },
        { status: 404 }
      );
    }

    console.log('Order Updated Successfully:', updatedOrder);

    return NextResponse.json(
      {
        message: 'Order status updated successfully',
        order: updatedOrder,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('PATCH Error:', error);
    return NextResponse.json(
      {
        message: 'Error updating order',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE: Remove an order by ID
export async function DELETE(req, { params }) {
  try {
    // Ensure database connection
    await connectToDb();

    const orderId = params?.id;

    console.log('DELETE Request:', { orderId });

    if (!orderId) {
      return NextResponse.json(
        { message: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Find and delete the order
    const deletedOrder = await Order.findByIdAndDelete(orderId);

    if (!deletedOrder) {
      return NextResponse.json(
        { message: 'Order not found' },
        { status: 404 }
      );
    }

    console.log('Order Deleted Successfully:', deletedOrder);

    return NextResponse.json(
      {
        message: 'Order deleted successfully',
        order: deletedOrder,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json(
      {
        message: 'Error deleting order',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
