// app/api/kitchen/updates/route.js
import { NextResponse } from 'next/server';
import Order from '@/models/Order';
import connectToDb from '@/lib/mongodb';
import { addClient, removeClient } from '@/lib/kitchen-sse';

export async function GET(request) {
  await connectToDb();

  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get('restaurantId');

  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  };

  const stream = new ReadableStream({
    start(controller) {
      const client = {
        write: (message) => {
          try {
            controller.enqueue(new TextEncoder().encode(message));
          } catch (error) {
            console.error('Error writing to SSE client:', error);
          }
        }
      };

      addClient(client);

      const sendInitialOrders = async () => {
        try {
          // Build query for kitchen-ready orders
          const query = {
            paymentStatus: "paid",                    // Only paid orders
            sentToKitchen: true,                      // Only orders sent to kitchen
            kitchenHidden: { $ne: true },             // Not hidden from kitchen
            status: { $nin: ["Delivered", "Cancelled"] } // Exclude finished orders
          };

          // Filter by restaurant if provided
          if (restaurantId) {
            query.restaurantId = restaurantId;
          }

          const paidOrders = await Order.find(query)
            .sort({ paymentConfirmedAt: -1, createdAt: -1 })
            .lean();

          console.log(`Sending ${paidOrders.length} paid orders to kitchen dashboard`);

          // Send initial batch of kitchen-ready orders
          paidOrders.forEach(order => {
            const orderData = {
              _id: order._id.toString(),
              orderNumber: order.orderNumber,
              restaurantId: order.restaurantId,
              restaurantName: order.restaurantName,
              items: order.items,
              totalPrice: order.totalPrice,
              status: order.status,
              kitchenStatus: order.kitchenStatus || 'Pending',
              paymentStatus: order.paymentStatus,
              paymentConfirmedAt: order.paymentConfirmedAt,
              sentToKitchenAt: order.sentToKitchenAt,
              createdAt: order.createdAt,
              customerNotes: order.customerNotes || '',
              estimatedPreparationTime: order.estimatedPreparationTime || 15,
              kitchenPriority: order.kitchenPriority || false,
              type: 'initial_order'
            };
            
            client.write(`data: ${JSON.stringify(orderData)}\n\n`);
          });

          // Send connection confirmation
          client.write(`data: ${JSON.stringify({ 
            type: 'connection_established', 
            timestamp: new Date().toISOString(),
            ordersCount: paidOrders.length,
            restaurantId: restaurantId || 'all'
          })}\n\n`);

          // Send heartbeat to keep connection alive
          const heartbeat = setInterval(() => {
            try {
              client.write(`data: ${JSON.stringify({ 
                type: 'heartbeat', 
                timestamp: new Date().toISOString() 
              })}\n\n`);
            } catch (error) {
              console.error('Heartbeat error:', error);
              clearInterval(heartbeat);
            }
          }, 30000); // Every 30 seconds

          // Clean up on disconnect
          request.signal.addEventListener('abort', () => {
            console.log('Kitchen SSE client disconnected');
            clearInterval(heartbeat);
          });

        } catch (error) {
          console.error('Error sending initial orders to kitchen:', error);
          client.write(`data: ${JSON.stringify({ 
            type: 'error', 
            message: 'Failed to load kitchen orders',
            error: error.message 
          })}\n\n`);
        }
      };

      sendInitialOrders();

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        console.log('Kitchen SSE client disconnected');
        removeClient(client);
        controller.close();
      });
    }
  });

  return new NextResponse(stream, {
    status: 200,
    headers
  });
}

// Export broadcast function for other modules to use
export const broadcastUpdate = async (orderData) => {
  try {
    // Only broadcast if payment is confirmed and order is sent to kitchen
    if (orderData.paymentStatus === "paid" && orderData.sentToKitchen !== false) {
      const { broadcastUpdate: broadcast } = await import('@/lib/kitchen-sse');
      
      const formattedOrderData = {
        _id: orderData._id?.toString() || orderData.id?.toString(),
        orderNumber: orderData.orderNumber,
        restaurantId: orderData.restaurantId,
        restaurantName: orderData.restaurantName,
        items: orderData.items,
        totalPrice: orderData.totalPrice,
        status: orderData.status,
        kitchenStatus: orderData.kitchenStatus || 'Pending',
        paymentStatus: orderData.paymentStatus,
        paymentConfirmedAt: orderData.paymentConfirmedAt,
        sentToKitchenAt: orderData.sentToKitchenAt,
        createdAt: orderData.createdAt,
        customerNotes: orderData.customerNotes || '',
        estimatedPreparationTime: orderData.estimatedPreparationTime || 15,
        kitchenPriority: orderData.kitchenPriority || false,
        type: orderData.type || 'order_update',
        timestamp: new Date().toISOString()
      };
      
      broadcast(formattedOrderData);
      console.log(`Broadcasted order ${orderData.orderNumber} to kitchen dashboard`);
    } else {
      console.log(`Skipping broadcast for order ${orderData.orderNumber} - payment not confirmed or not sent to kitchen`);
    }
  } catch (error) {
    console.error('Error in broadcastUpdate:', error);
  }
};