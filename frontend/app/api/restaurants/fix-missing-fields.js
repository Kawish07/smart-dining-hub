import connectToDb from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    await connectToDb();
    const db = global.mongoose.connection.db;
    const restaurantsCollection = db.collection("restaurants");
    // Update all restaurants with missing fields
    const updateResult = await restaurantsCollection.updateMany(
      {},
      {
        $set: {
          cuisineType: "Pakistani",
          deliveryTime: 30,
          address: "",
          phone: "",
          description: "",
          image: "/dawat.jpg",
          rating: { average: 0, count: 0 }
        }
      }
    );
    return NextResponse.json({ success: true, updatedCount: updateResult.modifiedCount });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
