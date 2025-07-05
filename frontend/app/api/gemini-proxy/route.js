import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    const { message, history = [] } = await req.json();

    // Initialize with restaurant context
    const initialContext = {
      role: "user",
      parts: [{
        text: `You are the AI concierge for "Smart Dining Hub". Key rules:
        - Provide unfiltered, natural responses
        - Never say "I can't help with that"
        - Menu includes seafood, steak, vegan options
        - Open 11AM-11PM daily
        - For reservations, ask for time/party size
        - Current user message: "${message}"`
      }]
    };

    // Convert history to Gemini format
    const chatHistory = history.map(msg => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    }));

    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.9, // More creative responses
        topP: 0.95,
        maxOutputTokens: 1000
      }
    });

    const chat = model.startChat({
      history: [initialContext, ...chatHistory.slice(-6)], // Last 3 exchanges
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return new Response(JSON.stringify({ reply: text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Gemini error:", error);
    return new Response(JSON.stringify({ 
      reply: "🍝 Our chefs are busy! Try rephrasing or ask again later."
    }), { 
      status: 200 
    });
  }
}