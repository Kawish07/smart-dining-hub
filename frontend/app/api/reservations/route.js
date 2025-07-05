import { NextResponse } from "next/server";
import connectToDb from "@/lib/mongodb";
import Reservation from "@/models/Reservation";
import Restaurant from "@/models/Restaurant";
import Table from "@/models/Table";

export async function GET(request) {
  try {
    await connectToDb();

    const { searchParams } = new URL(request.url);
    const restaurantSlug = searchParams.get("restaurantSlug");
    const filter = searchParams.get("filter") || "all";

    // Base query
    let query = {};

    // Filter by restaurant if slug provided
    if (restaurantSlug) {
      const restaurant = await Restaurant.findOne({ slug: restaurantSlug });
      if (!restaurant) {
        return NextResponse.json(
          { error: "Restaurant not found" },
          { status: 404 }
        );
      }
      query.restaurantId = restaurant._id;
    }

    // Date filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filter === "today") {
      query.date = today.toISOString().split('T')[0];
    } else if (filter === "upcoming") {
      query.date = { $gte: today.toISOString().split('T')[0] };
    }

    // Get reservations with populated table data
    const reservations = await Reservation.find(query)
      .populate({
        path: "table",
        select: "number capacity"
      })
      .sort({ date: 1, time: 1 });

    return NextResponse.json(
      reservations.map(res => ({
        ...res.toObject(),
        tableNumber: res.table?.number,
        tableCapacity: res.table?.capacity,
        transactionId: res.transactionId,
        paymentMethod: res.paymentMethod,
        paymentAmount: res.paymentAmount,
        paymentStatus: res.paymentStatus
      })),
      { status: 200 }
    );

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reservations", details: error.message },
      { status: 500 }
    );
  }
}
// app/api/reservations/route.j

export async function POST(request) {
  try {
    const body = await request.json();
    
    const reservationData = {
      restaurantId: body.restaurantId || body.restaurantSlug,
      restaurantSlug: body.restaurantSlug,
      date: body.date,
      time: body.time,
      persons: parseInt(body.persons || body.partySize || body.guests),
      table: body.table || body.tableId,
      customerEmail: body.customerEmail.toLowerCase().trim(),
      source: body.source || (body.chatbotId ? "chatbot" : "website"),
      status: "Confirmed",
      specialRequests: body.specialRequests || "",
      paymentAmount: body.paymentAmount || 0,
      transactionId: body.transactionId || "", // <-- Add this line
      ...(body.chatbotId && { chatbotId: body.chatbotId }),
    };

    // Validate required fields
    const requiredFields = ["restaurantId", "date", "time", "persons", "table",'customerEmail'];
    const missingFields = requiredFields.filter(field => !reservationData[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    await connectToDb();

    // 🔍 Fix: Ensure restaurantId is included in the existing reservation check
    const existingReservation = await Reservation.findOne({
      restaurantId: reservationData.restaurantId,
      table: reservationData.table,
      date: reservationData.date,
      time: reservationData.time
    });

    if (existingReservation) {
      return NextResponse.json(
        { error: "This table is already reserved for the selected time" },
        { status: 400 }
      );
    }

    // Save new reservation
    const newReservation = await Reservation.create(reservationData);

    // Populate table info for response
    const populatedReservation = await Reservation.findById(newReservation._id)
      .populate({ path: "table", select: "number capacity" });

    return NextResponse.json({
      ...populatedReservation.toObject(),
      tableNumber: populatedReservation.table?.number,
      tableCapacity: populatedReservation.table?.capacity,
      persons: populatedReservation.persons,
      date: populatedReservation.date,
      time: populatedReservation.time,
      transactionId: populatedReservation.transactionId // <-- Add this line
    }, { status: 201 });

  } catch (error) {
    console.error("Reservation creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create reservation" },
      { status: 500 }
    );
  }
}