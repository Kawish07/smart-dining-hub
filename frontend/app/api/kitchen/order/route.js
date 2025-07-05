// app/api/kitchen/orders/route.js
import connectToDb from "@/lib/mongodb";
import Order from "@/models/Order";
import OrderHistory from "@/models/OrderHistory";
import { broadcastUpdate } from '../updates/route';

export const dynamic = 'force-dynamic'; 

// GET: Fetch kitchen orders (only show PAID orders that are sent to kitchen)
export async function GET(request) {
  try {
    await connectToDb();
    const { searchParams } = new URL(request.url);
    const dashboard = searchParams.get('dashboard');
    const restaurantId = searchParams.get('restaurantId');

    // Build query specific for kitchen dashboard
    let query = {};
    
    if (dashboard === 'kitchen') {
      query = {
        paymentStatus: "paid",           // CRITICAL: Only paid orders
        sentToKitchen: true,             // Only orders sent to kitchen
        kitchenHidden: { $ne: true },    // Not hidden from kitchen
        status: { $nin: ["Delivered", "Cancelled"] } // Exclude finished orders
      };
      
      // Filter by restaurant if provided
      if (restaurantId) {
        query.restaurantId = restaurantId;
      }
    }

    // Pagination
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ paymentConfirmedAt: -1, createdAt: -1 }) // Sort by payment confirmation time
        .limit(limit)
        .lean(),
      Order.countDocuments(query)
    ]);

    // Format response with kitchen-specific data
    return new Response(JSON.stringify({
      success: true,
      orders: orders.map(order => ({
        _id: order._id.toString(),
        orderNumber: order.orderNumber,
        restaurantId: order.restaurantId,
        restaurantName: order.restaurantName,
        items: order.items,
        totalPrice: order.totalPrice,
        status: order.status,
        kitchenStatus: order.kitchenStatus,
        paymentStatus: order.paymentStatus,
        paymentConfirmedAt: order.paymentConfirmedAt?.toISOString(),
        sentToKitchenAt: order.sentToKitchenAt?.toISOString(),
        createdAt: order.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: order.updatedAt?.toISOString() || new Date().toISOString(),
        customerNotes: order.customerNotes || '',
        estimatedPreparationTime: order.estimatedPreparationTime || 15,
        kitchenPriority: order.kitchenPriority || false
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error("Fetch kitchen orders error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Failed to fetch kitchen orders"
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// PATCH: Update order status (specific for kitchen operations)
export async function PATCH(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const body = await request.json();

    if (!orderId) {
      return new Response(JSON.stringify({
        success: false,
        error: "Order ID is required"
      }), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    await connectToDb();

    // Get the order and verify it's ready for kitchen operations
    const order = await Order.findById(orderId);
    if (!order) {
      return new Response(JSON.stringify({
        success: false,
        error: "Order not found"
      }), { status: 404 });
    }

    // Verify order is ready for kitchen operations
    if (!order.isReadyForKitchen()) {
      return new Response(JSON.stringify({
        success: false,
        error: "Order is not ready for kitchen operations - payment may not be confirmed"
      }), { status: 400 });
    }

    // Update kitchen status using model method
    if (body.kitchenStatus) {
      await order.updateKitchenStatus(body.kitchenStatus);
    } else if (body.status) {
      // Direct status update (fallback)
      order.status = body.status;
      await order.save();
    }

    // If order is delivered, archive to history
    if (order.kitchenStatus === "Delivered" || order.status === "Delivered") {
      await archiveOrderToHistory(order);
    }

    // Broadcast update to all connected clients
    if (typeof broadcastUpdate === 'function') {
      await broadcastUpdate({
        _id: order._id.toString(),
        orderNumber: order.orderNumber,
        restaurantId: order.restaurantId,
        restaurantName: order.restaurantName,
        items: order.items,
        totalPrice: order.totalPrice,
        status: order.status,
        kitchenStatus: order.kitchenStatus,
        paymentStatus: order.paymentStatus,
        paymentConfirmedAt: order.paymentConfirmedAt,
        sentToKitchenAt: order.sentToKitchenAt,
        createdAt: order.createdAt,
        customerNotes: order.customerNotes,
        estimatedPreparationTime: order.estimatedPreparationTime,
        type: 'kitchen_status_update'
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Order status updated successfully",
      order: {
        _id: order._id.toString(),
        orderNumber: order.orderNumber,
        status: order.status,
        kitchenStatus: order.kitchenStatus,
        paymentStatus: order.paymentStatus
      }
    }), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error("Update kitchen order error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Failed to update order"
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// Utility: Archive delivered orders to history
async function archiveOrderToHistory(order) {
  try {
    // Check if OrderHistory model exists
    if (mongoose.models.OrderHistory || OrderHistory) {
      const historyRecord = new OrderHistory({
        originalOrderId: order._id,
        ...order.toObject(),
        kitchenStatusAtArchive: order.kitchenStatus,
        originalCreatedAt: order.createdAt,
        archivedAt: new Date()
      });

      await historyRecord.save();
      await Order.findByIdAndUpdate(order._id, { archivedToHistory: true });
      console.log(`Order ${order.orderNumber} archived to history`);
    }
  } catch (error) {
    console.error("Archive error:", error);
    // Don't throw error - archiving failure shouldn't stop order processing
  }
}