import dbConnect from "@/lib/mongodb";
import Table from "@/models/Table";
import { NextResponse } from "next/server";

export async function GET() {
  await dbConnect();
  const tables = await Table.find();
  return NextResponse.json(tables);
}

export async function POST(req) {
  await dbConnect();
  const { number, capacity } = await req.json();
  const newTable = new Table({ number, capacity });
  await newTable.save();
  return NextResponse.json(newTable);
}

export async function DELETE(req) {
  await dbConnect();
  const { id } = await req.json();
  await Table.findByIdAndDelete(id);
  return NextResponse.json({ message: "Table deleted" });
}