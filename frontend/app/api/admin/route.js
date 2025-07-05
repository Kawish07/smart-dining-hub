import connectToDb from "@/lib/mongodb";
import Order from "@/models/Order";

export async function GET() {
  try {
    await connectToDb(); // Ensure database connection

    // Fetch all orders, sorted by createdAt (newest first)
    const orders = await Order.find({}).sort({ createdAt: -1 });

    return new Response(JSON.stringify({ orders }), { status: 200 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch orders" }), { status: 500 });
  }
}