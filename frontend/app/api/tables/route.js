// app/api/tables/route.js
import { NextResponse } from "next/server";
import connectToDb from "@/lib/mongodb";
import Table from "@/models/Table";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId");
    const date = searchParams.get("date");
    const time = searchParams.get("time");
    const partySize = searchParams.get("partySize");

    if (!restaurantId) {
      return NextResponse.json(
        { error: "restaurantId is required" },
        { status: 400 }
      );
    }

    await connectToDb();

    // 🧠 If no date/time/partySize, just return all tables for the restaurant (admin use case)
    if (!date || !time || !partySize) {
      const tables = await Table.find({ restaurantId });
      return NextResponse.json(tables, { status: 200 });
    }

    // 🧠 Otherwise, perform availability logic (customer use case)
    const tables = await Table.find({
      restaurantId,
      capacity: { $gte: parseInt(partySize) }
    });

    const existingReservations = await Reservation.find({
      restaurantId,
      date,
      time
    });

    const availability = {
      small: 0,
      medium: 0,
      large: 0
    };

    const availableTables = tables.filter(table => {
      const isReserved = existingReservations.some(
        reservation => reservation.tableId.toString() === table._id.toString()
      );

      if (!isReserved) {
        switch (table.size) {
          case "small":
            availability.small++;
            break;
          case "medium":
            availability.medium++;
            break;
          case "large":
            availability.large++;
            break;
        }
        return true;
      }
      return false;
    });

    return NextResponse.json({
      available: availableTables.length > 0,
      availability,
      message: availableTables.length > 0
        ? "Tables are available"
        : "No tables available",
      tableId: availableTables.length > 0 ? availableTables[0]._id : null
    });

  } catch (error) {
    console.error("Availability check error:", error);
    return NextResponse.json(
      { error: "Failed to check table availability", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { number, size, capacity, description, restaurantId, restaurantName } = body;

    // Validate required fields
    if (!number || !size || !capacity || !restaurantId || !restaurantName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectToDb();

    // Check if table number already exists for this restaurant
    const existingTable = await Table.findOne({ number, restaurantId });
    if (existingTable) {
      return NextResponse.json(
        { error: "Table number already exists for this restaurant" },
        { status: 400 }
      );
    }

    const newTable = await Table.create({
      number,
      size,
      capacity,
      description,
      restaurantId,
      restaurantName,
      available: true
    });

    return NextResponse.json(newTable, { status: 201 });
  } catch (error) {
    console.error("Error adding table:", error);
    return NextResponse.json(
      { error: "Failed to add table" },
      { status: 500 }
    );
  }
}

// Add this to your existing app/api/tables/route.js
export async function DELETE(request) {
  try {
    const { tableId } = await request.json();
    
    if (!tableId) {
      return NextResponse.json(
        { error: "Table ID is required" },
        { status: 400 }
      );
    }

    await connectToDb();
    
    const deletedTable = await Table.findByIdAndDelete(tableId);
    
    if (!deletedTable) {
      return NextResponse.json(
        { error: "Table not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Table deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting table:", error);
    return NextResponse.json(
      { error: "Failed to delete table" },
      { status: 500 }
    );
  }
}