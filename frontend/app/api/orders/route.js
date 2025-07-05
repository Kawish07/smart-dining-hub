import connectToDb from "@/lib/mongodb";
import Order from "@/models/Order";
import OrderHistory from "@/models/OrderHistory";
import { broadcastUpdate } from '@/lib/kitchen-sse';

// Define valid payment methods in one place for consistency
const VALID_PAYMENT_METHODS = [
  "EasyPaisa", 
  "JazzCash", 
  "NayaPay", 
  "SadaPay", 
  "Allied Bank", 
  "Cash",
  // Legacy payment methods
  "Credit Card",
  "Debit Card",
  "Online Payment",
  "Mobile Wallet"
];

// POST: Create new order
export async function POST(req) {
  try {
    const body = await req.json();
    
    // Validate required fields
    const requiredFields = ["userId", "items", "totalPrice", "paymentMethod", "transactionId"];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        message: "Missing required fields",
        missingFields,
        validPaymentMethods: VALID_PAYMENT_METHODS
      }), { status: 400 });
    }

    // Validate payment method
    if (!VALID_PAYMENT_METHODS.includes(body.paymentMethod)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Invalid payment method. Valid methods are: ${VALID_PAYMENT_METHODS.join(", ")}`,
        validPaymentMethods: VALID_PAYMENT_METHODS
      }), { status: 400 });
    }

    await connectToDb();

    // Create new order with consistent numbering
    const newOrder = await Order.create({
      ...body,
      status: "Pending",
      kitchenStatus: "Pending",
      paymentStatus: "pending",
      kitchenHidden: true,
      orderTimestamp: new Date()
    });

    // Broadcast to all connected clients
    await broadcastUpdate(newOrder);

    return new Response(JSON.stringify({
      success: true,
      order: newOrder,
      message: "Order created successfully"
    }), { status: 201 });

  } catch (error) {
    console.error("Order creation error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Failed to create order",
      validPaymentMethods: VALID_PAYMENT_METHODS
    }), { status: 500 });
  }
}

// GET: Fetch orders with consistent filtering
export async function GET(request) {
  try {
    await connectToDb();
    const { searchParams } = new URL(request.url);

    // Build query based on parameters
    const query = {};
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const dashboard = searchParams.get('dashboard');
    const paymentMethod = searchParams.get('paymentMethod');

    if (userId) query.userId = userId;
    
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    if (dashboard === 'kitchen') {
      query.kitchenHidden = { $ne: true };
      query.$or = [
        { kitchenStatus: "Pending" },
        { kitchenStatus: "Preparing" },
        { kitchenStatus: "Ready" }
      ];
    } else if (status === 'active') {
      query.status = { $ne: "Delivered" };
    } else if (status === 'delivered') {
      query.status = "Delivered";
    }

    // Pagination
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    // Fetch orders with consistent sorting
    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query)
    ]);

    // Format response with consistent structure
    return new Response(JSON.stringify({
      success: true,
      orders: orders.map(order => ({
        ...order,
        _id: order._id.toString(),
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString()
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      validPaymentMethods: VALID_PAYMENT_METHODS
    }), { status: 200 });

  } catch (error) {
    console.error("Fetch orders error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Failed to fetch orders"
    }), { status: 500 });
  }
}

// PATCH: Update order status (used by both dashboards)
export async function PATCH(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const body = await request.json();

    if (!orderId) {
      return new Response(JSON.stringify({
        success: false,
        error: "Order ID is required"
      }), { status: 400 });
    }

    await connectToDb();

    // Special handling for kitchen operations
    if (body.kitchenHidden) {
      const updated = await Order.findByIdAndUpdate(
        orderId,
        { kitchenHidden: true },
        { new: true }
      );

      await broadcastUpdate(updated);
      return new Response(JSON.stringify({
        success: true,
        message: "Order removed from kitchen view"
      }), { status: 200 });
    }

    // Standard status update
    const updateFields = {};
    if (body.status) updateFields.status = body.status;
    if (body.kitchenStatus) updateFields.kitchenStatus = body.kitchenStatus;
    if (body.paymentMethod) {
      if (!VALID_PAYMENT_METHODS.includes(body.paymentMethod)) {
        return new Response(JSON.stringify({
          success: false,
          error: `Invalid payment method. Valid methods are: ${VALID_PAYMENT_METHODS.join(", ")}`
        }), { status: 400 });
      }
      updateFields.paymentMethod = body.paymentMethod;
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updateFields,
      { new: true }
    );

    // If order is delivered, archive to history
    if (body.status === "Delivered" || body.kitchenStatus === "Delivered") {
      await archiveOrderToHistory(updatedOrder);
    }

    await broadcastUpdate(updatedOrder);

    return new Response(JSON.stringify({
      success: true,
      order: updatedOrder
    }), { status: 200 });

  } catch (error) {
    console.error("Update order error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Failed to update order"
    }), { status: 500 });
  }
}

// Utility: Archive delivered orders to history
async function archiveOrderToHistory(order) {
  try {
    const historyRecord = new OrderHistory({
      originalOrderId: order._id,
      ...order.toObject(),
      kitchenStatusAtArchive: order.kitchenStatus,
      originalCreatedAt: order.createdAt
    });

    await historyRecord.save();
    await Order.findByIdAndUpdate(order._id, { archivedToHistory: true });

  } catch (error) {
    console.error("Archive error:", error);
    throw error;
  }
}