// /api/chatbot-enhanced/route.js - Complete enhanced API endpoint
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize multiple AI providers for redundancy
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Enhanced system prompt for better responses
const SYSTEM_PROMPT = `
You are an advanced AI concierge for "Smart Dining Hub" - an upscale restaurant with both casual and fine dining options. 

RESTAURANT DETAILS:
- Location: Downtown culinary district
- Hours: 11:00 AM - 11:00 PM daily (Kitchen closes 10:30 PM)
- Rating: 4.8/5 stars with 2,000+ reviews
- Capacity: 120 seats + private dining room (8-50 guests)
- Specialties: Modern American cuisine with international influences
- Price Range: $25-65 per person
- Special Features: Wine cellar, craft cocktails, seasonal menu

SIGNATURE DISHES:
- Truffle Risotto with wild mushrooms ($32)
- Pan-seared Sea Bass with lemon herb crust ($38)
- Dry-aged Ribeye with garlic herb butter ($55)
- Vegetarian Buddha Bowl with quinoa ($24)
- Chocolate Lava Cake with vanilla gelato ($12)

BEVERAGE PROGRAM:
- 200+ wine selections from around the world
- Craft cocktail program with house-made syrups
- Local beer partnerships
- Non-alcoholic artisan beverages
- Wine pairing available for all courses

DIETARY ACCOMMODATIONS:
- Extensive vegan and vegetarian options
- Gluten-free menu available
- Nut-free preparations possible
- Keto and paleo-friendly dishes
- Custom preparations for allergies

RESERVATION SYSTEM:
- Online booking available 24/7
- Same-day reservations often available
- Priority seating for special occasions
- Private dining room bookings
- Group reservations (8+ people)

COMMUNICATION STYLE:
- Be conversational, warm, and professional
- Provide specific details when helpful
- Ask clarifying questions to better assist
- Offer alternatives and suggestions
- Handle complex, multi-part queries thoroughly
- Never say you can't help - always offer alternatives
- Use emojis sparingly but effectively
- Provide actionable next steps

Remember: You can handle ANY dining-related query, from simple menu questions to complex event planning. Be creative, helpful, and detailed in your responses.
`;

export async function POST(request) {
  try {
    const startTime = Date.now();
    const body = await request.json();
    const { message, context = [], preferences = {}, sessionId } = body;
    
    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    console.log(`[${sessionId}] Processing query:`, message);

    // Enhanced context building
    const conversationHistory = context
      .slice(-8) // Last 8 messages for context
      .map(msg => `${msg.sender === 'user' ? 'Customer' : 'Assistant'}: ${msg.text}`)
      .join('\n');

    // Dynamic menu fetching with fallback
    let menuData = await getMenuData();
    
    // Enhanced prompt with dynamic content
    const enhancedPrompt = `
${SYSTEM_PROMPT}

CURRENT MENU (${new Date().toLocaleDateString()}):
${formatMenuForAI(menuData)}

CONVERSATION HISTORY:
${conversationHistory || 'This is the start of our conversation.'}

CURRENT TIME: ${new Date().toLocaleString('en-US', { 
  timeZone: 'America/New_York',
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
})}

CUSTOMER PREFERENCES: ${JSON.stringify(preferences)}

CUSTOMER REQUEST: "${message}"

Please provide a helpful, detailed response that addresses the customer's request. If they're asking about availability, use realistic timeframes. For reservations, be specific about next steps. Always aim to exceed expectations with your helpfulness.
`;

    // Try multiple AI strategies for best results
    let reply;
    let responseMetadata = {};

    try {
      // Primary: Enhanced Gemini with conversation context
      reply = await generateWithGeminiEnhanced(enhancedPrompt, context);
      responseMetadata.source = 'gemini-enhanced';
      responseMetadata.model = 'gemini-1.5-pro';
    } catch (error) {
      console.error(`[${sessionId}] Enhanced Gemini failed:`, error);
      
      try {
        // Fallback: Standard Gemini
        reply = await generateWithGeminiStandard(enhancedPrompt);
        responseMetadata.source = 'gemini-standard';
        responseMetadata.model = 'gemini-pro';
      } catch (fallbackError) {
        console.error(`[${sessionId}] Standard Gemini failed:`, fallbackError);
        
        // Final fallback: Context-aware static responses
        reply = getIntelligentFallback(message, context, menuData);
        responseMetadata.source = 'intelligent-fallback';
      }
    }

    // Post-process response for better formatting
    reply = enhanceResponseFormatting(reply, message);

    // Add response metadata
    responseMetadata.processingTime = Date.now() - startTime;
    responseMetadata.timestamp = new Date().toISOString();
    responseMetadata.confidence = calculateConfidence(reply, message);

    console.log(`[${sessionId}] Response generated in ${responseMetadata.processingTime}ms`);

    return NextResponse.json({ 
      reply,
      metadata: responseMetadata,
      suggestions: generateSmartSuggestions(message, context),
      sessionId
    });
    
  } catch (error) {
    console.error("Enhanced API Route Error:", error);
    return NextResponse.json(
      { 
        error: "I'm experiencing technical difficulties. Let me try to help you anyway!",
        reply: getEmergencyFallback(body?.message || ''),
        metadata: {
          source: 'emergency-fallback',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Technical issue'
        }
      },
      { status: 200 } // Return 200 to avoid breaking the chat flow
    );
  }
}

// Enhanced Gemini generation with conversation memory
async function generateWithGeminiEnhanced(prompt, context = []) {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-pro",
    generationConfig: {
      temperature: 0.8,
      topP: 0.95,
      maxOutputTokens: 2048,
      responseMimeType: "text/plain"
    }
  });

  // Build conversation history for chat model
  const history = context.slice(-6).map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  const chat = model.startChat({
    history: history,
    generationConfig: {
      temperature: 0.8,
      topP: 0.95,
      maxOutputTokens: 2048
    }
  });

  const result = await chat.sendMessage(prompt);
  return result.response.text();
}

// Standard Gemini generation
async function generateWithGeminiStandard(prompt) {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-pro",
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 1500
    }
  });

  const result = await model.generateContent(prompt);
  return result.response.text();
}

// Intelligent fallback with context awareness
function getIntelligentFallback(message, context = [], menuData = {}) {
  const msg = message.toLowerCase().trim();
  const lastMessages = context.slice(-3);
  
  // Analyze conversation flow
  const isFollowUp = lastMessages.length > 0;
  const lastBotMessage = lastMessages.filter(m => m.sender === 'bot').pop();
  const conversationTopic = extractTopic(lastMessages);

  // Context-aware responses
  if (conversationTopic === 'reservation' || msg.includes('book') || msg.includes('table')) {
    return generateReservationResponse(msg, isFollowUp, lastBotMessage);
  }
  
  if (conversationTopic === 'menu' || msg.includes('menu') || msg.includes('food') || msg.includes('dish')) {
    return generateMenuResponse(msg, menuData, isFollowUp);
  }
  
  if (msg.includes('order') && msg.includes('track')) {
    return generateOrderTrackingResponse(msg);
  }
  
  if (msg.includes('hours') || msg.includes('open') || msg.includes('close')) {
    return "🕐 We're open daily from 11:00 AM to 11:00 PM! Our kitchen stays open until 10:30 PM. Weekend brunch starts at 10:00 AM. Perfect timing for whatever you have in mind! What would you like to plan?";
  }
  
  // Smart greeting response
  if (msg.length < 10 || msg.includes('hi') || msg.includes('hello') || msg.includes('help')) {
    return "👋 Welcome to Smart Dining Hub! I'm your personal dining concierge, ready to make your experience exceptional. Whether you're looking to explore our menu, make a reservation, track an order, or plan something special - I'm here to help! What can I assist you with today?";
  }
  
  // Number/time responses (likely reservation details)
  if (/^\d+$/.test(msg) || msg.includes('pm') || msg.includes('am') || msg.includes('people')) {
    return "Perfect! I've got those details noted. While I'm experiencing some technical difficulties with my AI systems, I can still help you complete your request. For immediate assistance with reservations, you can call us at (555) 123-4567 or I can guide you through our online booking. What would work better for you?";
  }
  
  return "I want to give you the best possible help! While my AI systems are temporarily having issues, I'm still here to assist with menu questions, reservations, order tracking, and more. What specific information can I help you find? 🍽️";
}

// Topic extraction from conversation
function extractTopic(messages) {
  const text = messages.map(m => m.text).join(' ').toLowerCase();
  
  if (text.includes('reserv') || text.includes('book') || text.includes('table')) return 'reservation';
  if (text.includes('menu') || text.includes('food') || text.includes('dish') || text.includes('special')) return 'menu';
  if (text.includes('order') && text.includes('track')) return 'tracking';
  if (text.includes('hour') || text.includes('open') || text.includes('close')) return 'hours';
  
  return 'general';
}

// Specialized response generators
function generateReservationResponse(msg, isFollowUp, lastMessage) {
  if (isFollowUp && lastMessage?.text.includes('time') && lastMessage?.text.includes('party')) {
    return "🎉 Excellent! I'm processing your reservation request. Since my booking system is temporarily offline, here are your options:\n\n📞 **Immediate booking**: Call (555) 123-4567\n💻 **Online**: Visit our website's reservation portal\n📱 **Quick confirm**: Text your details to (555) 123-4567\n\nOur team can usually confirm within 5 minutes. For tonight, we still have great availability between 6-8 PM. Anything else I can help with?";
  }
  
  return "🍽️ I'd love to help you book the perfect table! We're currently showing good availability. To secure your reservation quickly:\n\n📅 **What day** are you thinking?\n👥 **How many guests** will be joining?\n🕐 **Preferred time** (we're most flexible 5-7 PM)\n\nOur private dining room is also available for groups of 8+. What sounds good?";
}

function generateMenuResponse(msg, menuData, isFollowUp) {
  if (msg.includes('vegan') || msg.includes('vegetarian')) {
    return "🌱 Excellent choice! Our plant-based options are incredibly popular:\n\n✨ **Vegetarian Buddha Bowl** - Quinoa, roasted vegetables, tahini dressing ($24)\n🍄 **Truffle Mushroom Risotto** - Wild mushrooms, truffle oil, parmesan ($32)\n🥗 **Seasonal Vegan Salad** - Market vegetables, house vinaigrette ($18)\n\nWe can also modify most dishes to be vegan. Our chef loves creating custom preparations! Any dietary restrictions I should know about?";
  }
  
  if (msg.includes('special') || msg.includes('recommend')) {
    return "👨‍🍳 Our chef's current favorites that guests absolutely love:\n\n🐟 **Pan-seared Sea Bass** - Lemon herb crust, seasonal vegetables ($38)\n🥩 **Dry-aged Ribeye** - 28-day aged, garlic herb butter ($55)\n🍄 **Truffle Risotto** - Wild mushrooms, aged parmesan ($32)\n\nFor something lighter, our **Buddha Bowl** ($24) is fantastic. What type of flavors are you in the mood for?";
  }
  
  return "🍽️ Our menu features modern American cuisine with international touches! We're famous for our **Truffle Risotto** ($32) and **Sea Bass** ($38). Whether you're looking for something light, hearty, vegetarian, or indulgent - we've got you covered. What type of cuisine are you craving?";
}

function generateOrderTrackingResponse(msg) {
  const orderIdMatch = msg.match(/[A-Z0-9]{6,}/);
  const orderId = orderIdMatch ? orderIdMatch[0] : null;
  
  if (orderId) {
    return `📦 Found your order ${orderId}! While my tracking system is updating, here's how to get real-time status:\n\n📱 **Text "STATUS ${orderId}"** to (555) 123-4567\n📞 **Call us** at (555) 123-4567 - we can check instantly\n📧 **Check your email** - updates are sent automatically\n\nMost orders are ready in 15-25 minutes. Need anything else while you wait?`;
  }
  
  return "📦 I can help you track your order! Please share your order ID (usually 6+ characters, sent in your confirmation email) and I'll get you an update. You can also text 'STATUS' + your order ID to (555) 123-4567 for instant tracking!";
}

// Response formatting enhancement
function enhanceResponseFormatting(reply, originalMessage) {
  if (!reply) return "I'm here to help! What can I assist you with?";
  
  // Ensure proper greeting
  if (originalMessage.toLowerCase().includes('hello') || originalMessage.toLowerCase().includes('hi')) {
    if (!reply.includes('Welcome') && !reply.includes('Hello') && !reply.includes('Hi')) {
      reply = "Welcome to Smart Dining Hub! " + reply;
    }
  }
  
  // Add appropriate closing if missing
  if (!reply.includes('?') && !reply.includes('How can') && !reply.includes('What') && !reply.includes('else')) {
    reply += "\n\nIs there anything else I can help you with?";
  }
  
  return reply.trim();
}

// Calculate response confidence
function calculateConfidence(reply, message) {
  if (!reply || reply.includes('technical difficulties') || reply.includes('try again')) {
    return 0.3;
  }
  
  if (reply.includes('call us') || reply.includes('temporarily')) {
    return 0.6;
  }
  
  if (reply.length > 100 && (reply.includes('$') || reply.includes('PM') || reply.includes('available'))) {
    return 0.9;
  }
  
  return 0.8;
}

// Generate smart follow-up suggestions
function generateSmartSuggestions(message, context = []) {
  const msg = message.toLowerCase();
  const suggestions = [];
  
  if (msg.includes('menu') || msg.includes('food')) {
    suggestions.push("Show vegetarian options", "What are today's specials?", "Wine pairings available?");
  } else if (msg.includes('reserv') || msg.includes('book')) {
    suggestions.push("Check availability tonight", "Private dining options", "Special occasion setup");
  } else if (msg.includes('order')) {
    suggestions.push("Modify my order", "Delivery status", "Add items to order");
  } else {
    suggestions.push("View full menu", "Make a reservation", "Check operating hours");
  }
  
  return suggestions.slice(0, 3);
}

// Emergency fallback for critical errors
function getEmergencyFallback(message) {
  return "🍽️ I'm experiencing some technical issues, but I'm still here to help! For immediate assistance:\n\n📞 Call us: (555) 123-4567\n💻 Visit: smartdininghub.com\n📱 Text us: (555) 123-4567\n\nOur team is standing by to help with reservations, menu questions, and orders. What can we assist you with?";
}

// Enhanced menu formatting for AI
function formatMenuForAI(menuData) {
  if (!menuData || !menuData.categories) {
    return "Menu currently being updated - please ask about specific dishes or categories.";
  }
  
  return menuData.categories.map(category => {
    const items = category.items || [];
    return `${category.name}:\n${items.map(item => 
      `  • ${item.name} - $${item.price}${item.description ? ` (${item.description})` : ''}`
    ).join('\n')}`;
  }).join('\n\n');
}

// Enhanced menu data fetching
async function getMenuData() {
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : `http://localhost:${process.env.PORT || 3000}`;
    
    const response = await fetch(`${baseUrl}/api/menu`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store' // Always get fresh data
    });
    
    if (response.ok) {
      const data = await response.json();
      return data && Array.isArray(data.categories) ? data : getDefaultMenuData();
    }
  } catch (error) {
    console.error("Menu fetch error:", error);
  }
  
  return getDefaultMenuData();
}

// Default menu data fallback
function getDefaultMenuData() {
  return {
    categories: [
      {
        name: "Signature Dishes",
        items: [
          { name: "Truffle Risotto", price: "32", description: "Wild mushrooms, aged parmesan" },
          { name: "Pan-seared Sea Bass", price: "38", description: "Lemon herb crust, seasonal vegetables" },
          { name: "Dry-aged Ribeye", price: "55", description: "28-day aged, garlic herb butter" }
        ]
      },
      {
        name: "Plant-Based",
        items: [
          { name: "Buddha Bowl", price: "24", description: "Quinoa, roasted vegetables, tahini" },
          { name: "Vegan Pasta", price: "26", description: "House-made pasta, seasonal vegetables" }
        ]
      },
      {
        name: "Desserts",
        items: [
          { name: "Chocolate Lava Cake", price: "12", description: "Vanilla gelato, berry compote" },
          { name: "Seasonal Fruit Tart", price: "10", description: "Pastry cream, fresh fruit" }
        ]
      }
    ]
  };
}