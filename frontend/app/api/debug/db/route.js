// app/api/debug/db/route.js
import { connectToDb } from "@/lib/mongodb";
import Order from "@/models/Order";
import OrderHistory from "@/models/OrderHistory";

export async function GET() {
  try {
    await connectToDb();
    
    // Test both collections
    const orderCount = await Order.countDocuments();
    const historyCount = await OrderHistory.countDocuments();
    
    // Get collection names to verify they exist
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    return new Response(
      JSON.stringify({
        success: true,
        database: mongoose.connection.db.databaseName,
        collections: collectionNames,
        stats: {
          orders: orderCount,
          orderHistory: historyCount
        }
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Database connection error:", error);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 500 }
    );
  }
}