// lib/nlp.js

/**
 * Analyze user query and extract intent and entities
 * @param {string} query - User's message
 * @param {object} context - Conversation context
 * @returns {object} - { intent, entities }
 */
export const analyzeQuery = (query, context = {}) => {
    // Normalize the query
    const normalizedQuery = query.toLowerCase().trim();
    
    // Define common intents and patterns
    const intentPatterns = [
      {
        intent: 'menu_query',
        patterns: [
          /menu|dish|food|eat|drink|item|what.*serve|what.*have|offer|serving/,
          /vegetarian|vegan|gluten|diet|allergy|halal|kosher/,
          /recommend|suggest|what.*good|what.*best|popular|special/
        ]
      },
      {
        intent: 'order_status',
        patterns: [
          /order.*track|track.*order|where.*order|status.*order|my.*order/,
          /when.*food|when.*ready|how.*long.*order/
        ]
      },
      {
        intent: 'reservation',
        patterns: [
          /reserv|book.*table|table.*book|dine.*in|eat.*there/,
          /available.*table|table.*available|when.*open/
        ]
      },
      {
        intent: 'restaurant_info',
        patterns: [
          /hour|open|close|time|when.*close|when.*open/,
          /location|address|where.*you|find.*you|place/
        ]
      }
    ];
  
    // Detect intent
    let detectedIntent = 'general_query';
    for (const { intent, patterns } of intentPatterns) {
      if (patterns.some(pattern => pattern.test(normalizedQuery))) {
        detectedIntent = intent;
        break;
      }
    }
  
    // Extract entities
    const entities = {
      dietary: extractDietary(normalizedQuery),
      orderId: extractOrderId(normalizedQuery),
      restaurant: extractRestaurant(normalizedQuery, context),
      datetime: extractDateTime(normalizedQuery)
    };
  
    return {
      intent: detectedIntent,
      entities
    };
  };
  
  // Helper functions for entity extraction
  const extractDietary = (query) => {
    const dietaryMap = {
      vegetarian: /vegetarian|veggie|no meat/,
      vegan: /vegan|no dairy|no egg/,
      gluten: /gluten|gf|celiac/,
      halal: /halal/,
      kosher: /kosher/
    };
  
    for (const [type, pattern] of Object.entries(dietaryMap)) {
      if (pattern.test(query)) return type;
    }
    return null;
  };
  
  const extractOrderId = (query) => {
    const orderIdPatterns = [
      /(?:order|#)?\s*([A-Z0-9]{6,})/i,
      /(?:order|#)?\s*(\d{4,}-\d{4,})/,
      /order\s+([^\s]+)/i
    ];
  
    for (const pattern of orderIdPatterns) {
      const match = query.match(pattern);
      if (match) return match[1];
    }
    return null;
  };
  
  const extractRestaurant = (query, context) => {
    // If context has current restaurant, use that
    if (context.currentRestaurant) {
      return context.currentRestaurant;
    }
  
    // Simple extraction - in a real app you'd match against known restaurants
    const restaurantPattern = /(?:at|in|from)\s+([^\s,.!?]+)/i;
    const match = query.match(restaurantPattern);
    return match ? match[1] : null;
  };
  
  const extractDateTime = (query) => {
    // Simple date/time patterns
    const datePattern = /(\d{1,2}\/\d{1,2}\/\d{4})|(\d{1,2}-\d{1,2}-\d{4})|today|tomorrow/i;
    const timePattern = /(\d{1,2}:\d{2})|(\d{1,2}\s*(?:am|pm))/i;
  
    return {
      date: query.match(datePattern)?.[0] || null,
      time: query.match(timePattern)?.[0] || null
    };
  };
  
  /**
   * Fallback response generator when no specific intent is matched
   */
  export const generateFallbackResponse = (query, context) => {
    const fallbacks = [
      "I'm not sure I understand. Could you rephrase that?",
      "I can help with menu items, reservations, and order tracking. What would you like to know?",
      `I'm your dining assistant. You can ask me about ${context.currentRestaurant || 'our restaurant'}'s menu, hours, or make a reservation.`,
      "Sorry, I didn't catch that. Could you try asking about our menu, hours, or reservations?"
    ];
  
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  };