import connectToDb from "@/lib/mongodb";
import Order from "@/models/Order";
import { broadcastUpdate } from '@/lib/kitchen-sse';

export async function PATCH(req, { params }) {
  try {
    const { id } = params;
    const { staffId } = await req.json();
    
    await connectToDb();

    const order = await Order.findById(id);
    if (!order) {
      return new Response(JSON.stringify({
        success: false,
        error: "Order not found"
      }), { status: 404 });
    }

    // Confirm payment and send to kitchen
    await order.confirmPaymentAndSendToKitchen(staffId);
    
    await broadcastUpdate(order);
    
    return new Response(JSON.stringify({
      success: true,
      order: order
    }), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500 });
  }
}