import { NextResponse } from "next/server";
import connectToDb from "@/lib/mongodb";
import Table from "@/models/Table";
import Reservation from "@/models/Reservation";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId");
    const date = searchParams.get("date");
    const time = searchParams.get("time");
    const partySize = parseInt(searchParams.get("partySize"));

    if (!restaurantId || !date || !time || !partySize) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    await connectToDb();

    // Find available tables
    const tables = await Table.find({ 
      restaurantId, 
      capacity: { $gte: partySize },
      available: true 
    });

    // Get existing reservations
    const existingReservations = await Reservation.find({ restaurantId, date, time });

    const availableTables = tables.filter(table => 
      !existingReservations.some(res => res.tableId.toString() === table._id.toString())
    );

    const bestTable = availableTables.sort((a, b) => a.capacity - b.capacity)[0];

    return NextResponse.json({
      available: availableTables.length > 0,
      tableId: bestTable?._id || null,
      tableSize: bestTable?.size || null,
      tableCapacity: bestTable?.capacity || null,
      restaurantId,
      date,
      time,
      partySize
    });

  } catch (error) {
    console.error("Availability check error:", error);
    return NextResponse.json({ error: "Failed to check table availability", details: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { date, time, partySize, restaurantId, tableId } = await request.json();

    if (!restaurantId || !tableId) {
      return NextResponse.json({ error: "Restaurant ID and Table ID are required" }, { status: 400 });
    }

    await connectToDb();

    // Check if table is available
    const existingReservation = await Reservation.findOne({ tableId, date, time });
    if (existingReservation) {
      return NextResponse.json({ error: "Table already reserved" }, { status: 409 });
    }

    // Create a new reservation
    const newReservation = new Reservation({ restaurantId, tableId, date, time, partySize });
    await newReservation.save();

    return NextResponse.json({ message: "Reservation confirmed", reservation: newReservation }, { status: 201 });

  } catch (error) {
    console.error("Error creating reservation:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
