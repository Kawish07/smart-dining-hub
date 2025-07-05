import { NextResponse } from "next/server";
import connectToDb from "@/lib/mongodb";
import Table from "@/models/Table";
import Reservation from "@/models/Reservation";
import Restaurant from "@/models/Restaurant"; // Add this import
import mongoose from "mongoose";

console.log('Mongoose version:', mongoose.version);

function getSuggestedTimes(requestedTime) {
  if (!requestedTime) return ['18:00', '19:00', '20:00'];

  const [hourStr, minuteStr] = requestedTime.split(':');
  let hour = parseInt(hourStr);
  const minute = parseInt(minuteStr);

  const times = [];

  // Generate times ±30 and ±60 minutes from requested time
  for (let offset of [-30, 30, -60, 60]) {
    const newMinutes = minute + offset;
    let newHours = hour + Math.floor(newMinutes / 60);
    const adjMinutes = ((newMinutes % 60) + 60) % 60;

    // Ensure hours stay within restaurant hours (11:00-22:00)
    newHours = Math.max(11, Math.min(22, newHours));

    const timeStr = `${String(newHours).padStart(2, '0')}:${String(adjMinutes).padStart(2, '0')}`;
    times.push(timeStr);
  }

  // Remove duplicates and sort
  return [...new Set(times)].sort();
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId");
    const date = searchParams.get("date");
    const time = searchParams.get("time");
    const partySize = parseInt(searchParams.get("partySize"));

    if (!restaurantId || !date || !time || isNaN(partySize)) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    await connectToDb();

    // Get restaurant details to include slug in response
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const tables = await Table.find({
      restaurantId,
      capacity: { $gte: partySize },
      available: true
    });

    const existingReservations = await Reservation.find({
      restaurantId,
      date,
      time
    });

    const availableTables = tables.filter(table =>
      !existingReservations.some(res => res.tableId.toString() === table._id.toString())
    );

    if (availableTables.length === 0) {
      return NextResponse.json({
        available: false,
        suggestedTimes: getSuggestedTimes(time),
        message: "No available tables",
        restaurantId,
        restaurantSlug: restaurant.slug // Include slug even when no tables available
      }, { status: 200 });
    }

    const bestTable = availableTables.sort((a, b) => a.capacity - b.capacity)[0];

    return NextResponse.json({
      available: true,
      tableId: bestTable._id,
      tableNumber: bestTable.number,
      tableSize: bestTable.size,
      tableCapacity: bestTable.capacity,
      restaurantId,
      restaurantSlug: restaurant.slug, // This is the crucial addition
      date,
      time,
      partySize
    });

  } catch (error) {
    console.error("Availability check error:", error);
    return NextResponse.json({
      error: "Failed to check table availability",
      details: error.message
    }, { status: 500 });
  }
}

// api/tables/availability/route.js
export async function POST(request) {
  try {
    const requestData = await request.json();
    await connectToDb();

    // Validate required fields
    const requiredFields = [
      'restaurantId',
      'restaurantSlug',
      'table',
      'date',
      'time',
      'partySize',
      'customerEmail'
    ];

    const missingFields = requiredFields.filter(field => !requestData[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if table exists
    const table = await Table.findById(requestData.table);
    if (!table) {
      return NextResponse.json(
        { error: "Table not found" },
        { status: 404 }
      );
    }

    // Create reservation data
    const reservationData = {
      restaurantId: requestData.restaurantId,
      restaurantSlug: requestData.restaurantSlug,
      table: requestData.table,
      customerEmail: requestData.customerEmail,
      tableNumber: table.number,
      date: requestData.date,
      time: requestData.time,
      persons: parseInt(requestData.partySize),
      specialRequests: requestData.specialRequests || '',
      status: requestData.status || "Confirmed",
      source: requestData.source || 'chatbot'
    };

    // Save reservation
    const newReservation = new Reservation(reservationData);
    await newReservation.save();

    return NextResponse.json({
      success: true,
      reservation: {
        _id: newReservation._id,
        tableNumber: table.number
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Reservation Error:", error);
    return NextResponse.json(
      { error: error.message, details: error.errors },
      { status: 500 }
    );
  }
}