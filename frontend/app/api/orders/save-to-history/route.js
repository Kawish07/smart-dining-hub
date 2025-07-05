// app/api/orders/history/route.js
import { connectToDb } from "@/lib/mongodb";
import Order from "@/models/Order";

export async function GET(request) {
  try {
    await connectToDb();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        { status: 400 }
      );
    }

    const orders = await Order.find({ 
      userId,
      status: { $in: ["Delivered", "Completed"] } 
    }).sort({ createdAt: -1 });

    return new Response(
      JSON.stringify({ orders }),
      { 
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    console.error("Error fetching order history:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch order history" }),
      { status: 500 }
    );
  }
}