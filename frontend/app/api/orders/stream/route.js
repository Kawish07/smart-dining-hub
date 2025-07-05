import connectToDb from "@/lib/mongodb";
import Order from "@/models/Order";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return new Response(JSON.stringify({ message: "User ID is required" }), { status: 400 });
    }

    await connectToDb(); // Ensure MongoDB connection

    // Setup SSE (Server-Sent Events)
    return new Response(
      new ReadableStream({
        start(controller) {
          console.log("SSE Connection Opened");

          const sendOrders = async () => {
            try {
              const orders = await Order.find({ userId }).sort({ createdAt: -1 });

              if (controller.desiredSize !== null) {
                // Send the entire array of orders
                controller.enqueue(`data: ${JSON.stringify(orders)}\n\n`);
              }
            } catch (error) {
              if (controller.desiredSize !== null) {
                controller.enqueue(`data: ${JSON.stringify({ error: "Failed to fetch orders" })}\n\n`);
              }
            }
          };

          sendOrders(); // Send initial orders immediately

          // Auto-refresh orders every 5 seconds
          const interval = setInterval(sendOrders, 5000);

          // Cleanup when the stream closes
          controller.close = () => {
            clearInterval(interval);
            console.log("SSE Connection Closed");
          };
        },
        cancel() {
          console.log("SSE Connection Aborted");
        }
      }),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      }
    );
  } catch (error) {
    console.error("SSE Error:", error);
    return new Response(JSON.stringify({ message: "Server error", error: error.message }), { status: 500 });
  }
}