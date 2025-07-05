import { NextResponse } from 'next/server';
import Order from '@/models/Order';
import connectToDb from '@/lib/mongodb';

export async function GET(request) {
  await connectToDb();
  
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return new Response(JSON.stringify({ error: 'User ID is required' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // Set SSE headers
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  };

  // Create a transform stream for SSE
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  // Function to send SSE messages
  const sendEvent = (data) => {
    writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  // Initial connection message
  sendEvent({ type: 'connected', message: 'SSE connection established' });

  // Set up change stream
  const pipeline = [
    {
      $match: {
        $and: [
          { userId: userId },
          {
            $or: [
              { 'fullDocument.status': { $in: ['Pending', 'Confirmed', 'Preparing', 'Ready'] } },
              { operationType: 'delete' }
            ]
          }
        ]
      }
    }
  ];

  try {
    const changeStream = Order.watch(pipeline);

    changeStream.on('change', (change) => {
      if (change.operationType === 'delete') {
        sendEvent({ type: 'deleted', id: change.documentKey._id });
      } else {
        sendEvent({ type: 'update', order: change.fullDocument });
      }
    });

    // Handle client disconnect
    request.signal.addEventListener('abort', () => {
      changeStream.close();
      writer.close();
    });

    return new NextResponse(stream.readable, { headers });

  } catch (error) {
    console.error('SSE Error:', error);
    sendEvent({ type: 'error', error: error.message });
    writer.close();
    return new Response(JSON.stringify({ error: 'SSE failed' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}