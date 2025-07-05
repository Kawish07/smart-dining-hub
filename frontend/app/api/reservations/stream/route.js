import { NextResponse } from "next/server";
import connectToDb from "@/lib/mongodb";
import Reservation from "@/models/Reservation";
import Table from "@/models/Table";

export async function GET() {
  await connectToDb();
  
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();

  const sendEvent = async (data) => {
    const encoder = new TextEncoder();
    await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  // Initial data
  const initialReservations = await Reservation.find()
    .populate('table', 'number capacity')
    .sort({ date: 1, time: 1 });
  
  await sendEvent(initialReservations);

  // Real-time updates
  const changeStream = Reservation.watch([], { fullDocument: 'updateLookup' });

  changeStream.on('change', async (change) => {
    const updatedReservation = await Reservation.findById(change.documentKey._id)
      .populate('table', 'number capacity');
    
    await sendEvent({
      event: change.operationType,
      data: {
        ...updatedReservation.toObject(),
        tableNumber: updatedReservation.table?.number,
        tableCapacity: updatedReservation.table?.capacity
      }
    });
  });

  // Cleanup
  const cleanup = () => {
    changeStream.close();
    writer.close();
  };

  // Handle client disconnect
  return new NextResponse(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    },
    // Next.js specific way to handle connection close
    onClose: cleanup
  });
}