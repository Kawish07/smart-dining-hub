import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import { NextResponse } from "next/server";

export async function GET() {
  await dbConnect();

  // Fetch all orders
  const orders = await Order.find();

  // Calculate total revenue
  const totalRevenue = orders.reduce((total, order) => {
    return total + order.totalAmount;
  }, 0);

  return NextResponse.json({ totalRevenue });
}