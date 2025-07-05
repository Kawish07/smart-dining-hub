import { NextResponse } from "next/server";
import connectToDb from "@/lib/mongodb";
import Order from "@/models/Order";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderIds = searchParams.get('ids')?.split(',') || [];

    if (orderIds.length === 0) {
      return NextResponse.json(
        { error: "No order IDs provided" },
        { status: 400 }
      );
    }

    // Set up SSE headers
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // Write initial response
    await writer.write(encoder.encode(': connected\n\n'));

    // Set up interval to check for updates
    const interval = setInterval(async () => {
      try {
        await connectToDb();
        const updatedOrders = await Order.find({
          _id: { $in: orderIds },
          $or: [
            { status: { $ne: "Delivered" } },
            { kitchenStatus: { $ne: "Delivered" } }
          ]
        });

        for (const order of updatedOrders) {
          await writer.write(encoder.encode(
            `data: ${JSON.stringify(order)}\n\n`
          ));
        }
      } catch (error) {
        console.error("Error checking for updates:", error);
      }
    }, 5000); // Check every 5 seconds

    // Clean up on client disconnect
    request.signal.onabort = () => {
      clearInterval(interval);
      writer.close();
    };

    return new NextResponse(stream.readable, { headers });
  } catch (error) {
    console.error("SSE error:", error);
    return NextResponse.json(
      { error: "SSE connection failed" },
      { status: 500 }
    );
  }
}