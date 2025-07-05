import connectToDb from "@/lib/mongodb";
import Reservation from "@/models/Reservation";

export async function PUT(req, { params }) {
  const { reservationId } = params;

  try {
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return new Response(JSON.stringify({ error: "Status is required." }), { status: 400 });
    }

    await connectToDb();

    const updatedReservation = await Reservation.findByIdAndUpdate(
      reservationId,
      { status },
      { new: true }
    );

    if (!updatedReservation) {
      return new Response(JSON.stringify({ error: "Reservation not found." }), { status: 404 });
    }

    return new Response(JSON.stringify(updatedReservation), { status: 200 });
  } catch (error) {
    console.error("Error updating reservation status:", error);
    return new Response(JSON.stringify({ error: "Failed to update reservation status." }), { status: 500 });
  }
}