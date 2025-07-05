import { NextResponse } from "next/server";
import connectToDb from "@/lib/mongodb";
import Order from "@/models/Order";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('txnId');
    
    await connectToDb();
    const order = await Order.findOne({ easypaisaRef: transactionId });
    
    return NextResponse.json({
      status: order?.paymentStatus === "completed" ? "SUCCESS" : "PENDING"
    });

  } catch (error) {
    return NextResponse.json(
      { status: "ERROR" },
      { status: 500 }
    );
  }
}