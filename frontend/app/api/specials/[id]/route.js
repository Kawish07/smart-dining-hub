// app/api/specials/[id]/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Special from "@/models/Special";
import mongoose from "mongoose";

// DELETE handler - Delete a special dish
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid special dish ID" },
        { status: 400 }
      );
    }

    const deletedSpecial = await Special.findByIdAndDelete(id);
    
    if (!deletedSpecial) {
      return NextResponse.json(
        { error: "Special dish not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: "Special dish deleted successfully" });
  } catch (error) {
    console.error("Error deleting special dish:", error);
    return NextResponse.json(
      { error: "Failed to delete special dish" },
      { status: 500 }
    );
  }
}

// PUT handler - Update a special dish
export async function PUT(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    const body = await request.json();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid special dish ID" },
        { status: 400 }
      );
    }

    const updatedSpecial = await Special.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );
    
    if (!updatedSpecial) {
      return NextResponse.json(
        { error: "Special dish not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedSpecial);
  } catch (error) {
    console.error("Error updating special dish:", error);
    return NextResponse.json(
      { error: "Failed to update special dish" },
      { status: 500 }
    );
  }
}