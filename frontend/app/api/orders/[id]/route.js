import connectToDb from "@/lib/mongodb";
import Order from "@/models/Order";
import { broadcastUpdate } from '@/lib/kitchen-sse';


export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const { status, paymentStatus } = await req.json();

    await connectToDb();

    // Get the current order first for validation
    const currentOrder = await Order.findById(id);
    if (!currentOrder) {
      return new Response(JSON.stringify({ error: "Order not found" }), { status: 404 });
    }

    // Prevent kitchen status updates for unpaid orders
    if (status === "Preparing" && currentOrder.paymentStatus !== "paid") {
      return new Response(JSON.stringify({
        error: "Cannot start preparing: Payment not confirmed!"
      }), { status: 403 });
    }

    // Update the order
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { 
        status,
        paymentStatus: paymentStatus || currentOrder.paymentStatus 
      },
      { new: true }
    );

    // Broadcast to kitchen dashboard if payment was just confirmed
    if (paymentStatus === "paid") {
      await broadcastUpdate(updatedOrder);
    }

    return new Response(JSON.stringify({ 
      message: "Order updated successfully", 
      order: updatedOrder 
    }), { status: 200 });

  } catch (error) {
    console.error("Error updating order:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to update order",
      details: error.message 
    }), { status: 500 });
  }
}