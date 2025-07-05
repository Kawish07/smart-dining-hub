import { NextResponse } from 'next/server';

async function fetchRestaurants() {
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/restaurants`);
    if (!res.ok) throw new Error('Failed to fetch restaurants');
    return await res.json();
  } catch (error) {
    console.error('Restaurant fetch error:', error);
    return [];
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { message, context = '', conversationHistory = [], userProfile = {} } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const restaurants = await fetchRestaurants();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let response = "";
          const lowerMsg = message.toLowerCase();

          // Check conversation context
          const isReservationFlow = context.includes('RESERVATION');
          const isOrderTracking = context.includes('ORDER_TRACKING');
          const isMenuRequest = context.includes('MENU');

          // Handle reservation flow
          if (isReservationFlow) {
            if (context.includes('restaurant_request')) {
              const restaurantMatch = restaurants.find(r => 
                lowerMsg.includes(r.name.toLowerCase()) || 
                lowerMsg.includes(r.slug.toLowerCase())
              );

              if (restaurantMatch) {
                response = `Great choice! Let's reserve at ${restaurantMatch.name}.\n\n` +
                  "Please provide:\n" +
                  "1. Date (DD-MM-YYYY)\n" +
                  "2. Time (11:00-22:00)\n" +
                  "3. Number of people\n" +
                  "4. Any special requests\n\n" +
                  "You can provide all details at once or one by one.";
              } else {
                response = "We currently accept reservations for these restaurants:\n\n" +
                  restaurants.map(r => `🏠 ${r.name}`).join('\n') +
                  "\n\nWhich one would you like to book?";
              }
            } else if (context.includes('reservation_details')) {
              response = "Thank you for the details. Processing your reservation...";
            }
          }
          // Handle order tracking
          else if (isOrderTracking) {
            const orderIdMatch = message.match(/([a-f\d]{24}|[\w-]{6,})/i);
            if (orderIdMatch) {
              response = `Checking status for order #${orderIdMatch[1]}...`;
            } else {
              response = "Please provide your order ID to track your order.";
            }
          }
          // Handle menu requests
          else if (isMenuRequest) {
            response = "Here are our available restaurants:\n\n" +
              restaurants.map(r => `🍽️ ${r.name} (${r.cuisine})`).join('\n') +
              "\n\nWhich restaurant's menu would you like to see?";
          }
          // Default response
          else {
            response = "Hello! I'm your AI dining assistant. How can I help you today?\n\n" +
              "I can assist with:\n" +
              "📦 Order tracking\n" +
              "📅 Table reservations\n" +
              "🍽️ Menu information\n" +
              "💬 General questions";
          }

          // Stream the response
          const words = response.split(' ');
          let currentIndex = 0;
          
          const sendChunk = () => {
            if (currentIndex < words.length) {
              const chunk = words[currentIndex] + (currentIndex < words.length - 1 ? ' ' : '');
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
              currentIndex++;
              setTimeout(sendChunk, 30);
            } else {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
            }
          };

          sendChunk();

        } catch (error) {
          console.error('Stream error:', error);
          const errorMsg = JSON.stringify({ 
            text: "I'm having trouble processing your request. Please try again."
          });
          controller.enqueue(encoder.encode(`data: ${errorMsg}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}