import dbConnect from "@/lib/mongodb";
import Staff from "@/models/Staff";
import { NextResponse } from "next/server";

export async function GET() {
  await dbConnect();
  const staff = await Staff.find();
  return NextResponse.json(staff);
}

export async function POST(req) {
  await dbConnect();
  const { name } = await req.json();
  const newStaff = new Staff({ name });
  await newStaff.save();
  return NextResponse.json(newStaff);
}

export async function DELETE(req) {
  await dbConnect();
  const { id } = await req.json();
  await Staff.findByIdAndDelete(id);
  return NextResponse.json({ message: "Staff deleted" });
}