import { NextResponse } from "next/server";
import connectToDb from "@/lib/mongodb";
import Reservation from "@/models/Reservation";

export async function POST(request) {
  try {
    const { reservationId, amount, method, currency, transactionId } = await request.json();

    if (!reservationId) {
      return NextResponse.json({ error: "Reservation ID is missing" }, { status: 400 });
    }

    await connectToDb();

    console.log("Updating Reservation with ID:", reservationId);

    // Ensure reservation exists before updating
    const existingReservation = await Reservation.findById(reservationId);
    if (!existingReservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    // Update reservation with payment info and transaction ID
    existingReservation.paymentAmount = amount;
    existingReservation.paymentMethod = method;
    existingReservation.paymentCurrency = currency;
    existingReservation.paymentStatus = "completed";
    existingReservation.status = "Confirmed";
    if (transactionId) {
      existingReservation.transactionId = transactionId;
    }

    await existingReservation.save();

    return NextResponse.json(
      { success: true, reservation: existingReservation },
      { status: 200 }
    );
  } catch (error) {
    console.error("Payment Error:", error);
    return NextResponse.json(
      { error: "Payment processing failed", details: error.message },
      { status: 500 }
    );
  }
}
