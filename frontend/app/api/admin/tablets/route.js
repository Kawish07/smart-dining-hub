import dbConnect from "@/lib/mongodb";
import Tablet from "@/models/Tablet";
import { NextResponse } from "next/server";

export async function GET() {
  await dbConnect();
  const tablets = await Tablet.find();
  return NextResponse.json(tablets);
}

export async function POST(req) {
  await dbConnect();
  const { number, status } = await req.json();
  const newTablet = new Tablet({ number, status });
  await newTablet.save();
  return NextResponse.json(newTablet);
}

export async function DELETE(req) {
  await dbConnect();
  const { id } = await req.json();
  await Tablet.findByIdAndDelete(id);
  return NextResponse.json({ message: "Tablet deleted" });
}