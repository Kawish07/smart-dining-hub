import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Check if API key exists
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not found in environment variables');
      return NextResponse.json(
        { error: 'AI service configuration error' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { message, context = '', conversationHistory = [], userProfile = {} } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Simple fallback response instead of Gemini for now
    const responses = [
      "I understand you're looking for dining assistance! I can help you with restaurant recommendations, menu options, and general dining questions. What specific type of cuisine are you interested in?",
      "That sounds delicious! I'd be happy to help you explore dining options. Are you looking for something specific like vegetarian options, a particular cuisine, or restaurant recommendations?",
      "Great question! I can assist you with finding the perfect dining experience. Would you like me to suggest some popular restaurants or help you with something specific?",
      "I'm here to help with all your dining needs! Whether it's menu recommendations, restaurant suggestions, or dietary preferences, I've got you covered. What can I help you find today?"
    ];

    // Simple response selection based on message content
    let response = responses[0];
    
    if (message.toLowerCase().includes('menu') || message.toLowerCase().includes('food')) {
      response = "I'd love to help you explore menu options! While I'm getting the full restaurant data ready, I can tell you that most of our partner restaurants offer a variety of cuisines including Italian, Asian, American, and vegetarian options. What type of food are you craving?";
    } else if (message.toLowerCase().includes('order') || message.toLowerCase().includes('track')) {
      response = "For order tracking, I'll need your order ID. It's usually a combination of letters and numbers that you received when you placed your order. Can you share your order ID with me?";
    } else if (message.toLowerCase().includes('reservation') || message.toLowerCase().includes('table')) {
      response = userProfile.isAuthenticated 
        ? "I can help you make a reservation! Please let me know: 1) Which restaurant you prefer, 2) What date (DD-MM-YYYY), 3) What time (11:00-22:00), and 4) How many people will be dining."
        : "I'd be happy to help you make a reservation! However, you'll need to sign in first to book a table. Once you're signed in, I can help you find the perfect spot and time for your dining experience.";
    }

    return NextResponse.json({ text: response });

  } catch (error) {
    console.error('Gemini Chat API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process your request. Please try again.' },
      { status: 500 }
    );
  }
}