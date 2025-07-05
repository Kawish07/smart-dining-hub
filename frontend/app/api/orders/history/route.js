// app/api/orders/history/route.js
import connectToDb from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    console.log("Connecting to DB...");
    const mongoose = await connectToDb();
    const db = mongoose.connection.db;
    console.log("DB connected successfully");

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return Response.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log(`Fetching orders for user: ${userId}`);
    
    // 1. First get delivered orders from orders collection that need archiving
    const deliveredOrders = await db.collection('orders')
      .find({
        userId,
        $or: [
          { status: "Delivered" },
          { kitchenStatus: "Delivered" }
        ],
        archivedToHistory: { $ne: true }
      })
      .toArray();

    // 2. Archive these orders to orderhistories if any found
    if (deliveredOrders.length > 0) {
      console.log(`Archiving ${deliveredOrders.length} delivered orders`);
      
      // Add additional fields before archiving
      const ordersToArchive = deliveredOrders.map(order => ({
        ...order,
        originalOrderId: order._id, // Keep reference to original
        archivedAt: new Date()
      }));

      await db.collection('orderhistories').insertMany(ordersToArchive);
      
      // 3. Mark these orders as archived
      await db.collection('orders').updateMany(
        { 
          _id: { $in: deliveredOrders.map(o => o._id) } 
        },
        { $set: { archivedToHistory: true } }
      );
    }

    // 4. Get all historical orders (both newly archived and existing ones)
    const historyOrders = await db.collection('orderhistories')
      .aggregate([
        { $match: { userId } },
        { $sort: { createdAt: -1 } },
        // Join with reviews collection if needed
        {
          $lookup: {
            from: "reviews",
            localField: "originalOrderId",
            foreignField: "orderId",
            as: "review"
          }
        },
        { $unwind: { path: "$review", preserveNullAndEmptyArrays: true } },
        // Project only needed fields
        {
          $project: {
            _id: 1,
            orderNumber: 1,
            items: 1,
            totalPrice: 1,
            status: 1,
            kitchenStatus: 1,
            createdAt: 1,
            restaurantId: 1,
            restaurantName: 1,
            restaurantSlug: 1,
            reviewed: 1,
            // Make sure restaurant data is included
            restaurant: { 
              _id: "$restaurantId", 
              name: "$restaurantName", 
              slug: "$restaurantSlug" 
            },
            review: {
              rating: 1,
              comment: 1,
              createdAt: 1
            }
          }
        }
      ])
      .toArray();

    console.log(`Found ${historyOrders.length} historical orders`);

    return Response.json({
      success: true,
      orders: historyOrders.map(order => ({
        ...order,
        _id: order._id.toString(),
        // Ensure restaurantId is always available
        restaurantId: order.restaurantId || (order.restaurant && order.restaurant._id) || null,
        restaurantName: order.restaurantName || (order.restaurant && order.restaurant.name) || "Restaurant",
        restaurantSlug: order.restaurantSlug || (order.restaurant && order.restaurant.slug) || "restaurant",
        createdAt: order.createdAt?.toISOString(),
        updatedAt: order.updatedAt?.toISOString(),
        review: order.review ? {
          ...order.review,
          _id: order.review._id.toString(),
          createdAt: order.review.createdAt?.toISOString()
        } : null
      }))
    });

  } catch (error) {
    console.error("API Error:", error);
    return Response.json(
      { 
        success: false, 
        error: "Internal server error",
        details: process.env.NODE_ENV === 'development' ? error.message : null
      },
      { status: 500 }
    );
  }
}