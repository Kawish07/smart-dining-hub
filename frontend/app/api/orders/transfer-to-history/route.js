// app/api/orders/move-to-history/route.js
import connectToDb from "@/lib/mongodb";
import Order from "@/models/Order";
import OrderHistory from "@/models/OrderHistory";

export async function POST(req) {
  try {
    const body = await req.json();
    const { orderId } = body;
    
    if (!orderId) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Order ID is required" 
      }), { 
        status: 400,
        headers: { "Content-Type": "application/json" } 
      });
    }

    await connectToDb();
    
    // Find the order to move
    const order = await Order.findById(orderId);
    
    if (!order) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Order not found" 
      }), { 
        status: 404,
        headers: { "Content-Type": "application/json" } 
      });
    }
    
    // Create new history record
    const historyRecord = new OrderHistory({
      ...order.toObject(),
      originalOrderId: order._id,
      movedToHistoryAt: new Date()
    });
    
    // Save to history
    await historyRecord.save();
    
    // Optional: Delete from active orders
    // Uncomment if you want to remove from the Order collection
    // await Order.findByIdAndDelete(orderId);
    
    // Or just mark as moved to history
    await Order.findByIdAndUpdate(orderId, { 
      status: "Delivered",
      movedToHistory: true
    });
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Order successfully moved to history",
      historyRecord
    }), { 
      status: 200,
      headers: { "Content-Type": "application/json" } 
    });
    
  } catch (error) {
    console.error("Error moving order to history:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: "Failed to move order to history", 
      error: error.message 
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" } 
    });
  }
}