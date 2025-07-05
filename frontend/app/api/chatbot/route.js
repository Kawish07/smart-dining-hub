import { NextResponse } from "next/server";

// Enhanced fuzzy matching with better scoring
function fuzzyFind(arr, target) {
  if (!target || !Array.isArray(arr)) return null;

  const cleanTarget = target.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const targetWords = cleanTarget.split(/\s+/);

  let best = null, bestScore = 0;

  for (const obj of arr) {
    const name = (obj.name || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    const nameWords = name.split(/\s+/);

    // Exact match gets highest score
    if (name === cleanTarget) return obj;

    let score = 0;

    // Substring match
    if (name.includes(cleanTarget) || cleanTarget.includes(name)) {
      score += 80;
    }

    // Word-by-word matching
    for (const targetWord of targetWords) {
      for (const nameWord of nameWords) {
        if (nameWord === targetWord) score += 20;
        else if (nameWord.includes(targetWord) || targetWord.includes(nameWord)) score += 10;
      }
    }

    // Levenshtein distance for typos
    const distance = levenshteinDistance(cleanTarget, name);
    if (distance <= 2 && cleanTarget.length > 3) score += 15;

    if (score > bestScore) {
      bestScore = score;
      best = obj;
    }
  }

  return bestScore > 25 ? best : null;
}

// Levenshtein distance for typo tolerance
function levenshteinDistance(str1, str2) {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

// Enhanced time conversion with better parsing
// Enhanced time conversion with better parsing
function to24Hour(timeStr) {
  const timePatterns = [
    /^(\d{1,2}):(\d{2})\s*([ap]m)$/i,  // 7:50 PM
    /^(\d{1,2})\s*([ap]m)$/i,          // 7 PM
    /^(\d{1,2}):(\d{2})$/,             // 7:50
    /^(\d{1,2})$/                       // 7
  ];

  for (const pattern of timePatterns) {
    const match = timeStr.match(pattern);
    if (match) {
      let hour = parseInt(match[1], 10);
      const minute = match[2] || '00';  // Default to 00 minutes if not specified
      const period = match[3] ? match[3].toLowerCase() : null;

      // Validate hour and minute ranges
      if (hour < 0 || hour > 23) return timeStr; // Invalid hour
      if (minute && (parseInt(minute) < 0 || parseInt(minute) > 59)) return timeStr; // Invalid minute

      if (period) {
        // Handle AM/PM times
        if (period === 'pm' && hour !== 12) hour += 12;
        if (period === 'am' && hour === 12) hour = 0;
      } else if (!period && hour >= 1 && hour <= 11) {
        // Assume PM for evening hours if no period specified (only for hours 1-11)
        if (hour >= 6) hour += 12;
      }

      // Ensure hour is two digits and minute exists
      return `${hour.toString().padStart(2, '0')}:${minute.padStart(2, '0')}`;
    }
  }

  // If no pattern matched, return the original string
  return timeStr;
}

// Enhanced date parsing with more formats
function parseDate(dateStr) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dateString = dateStr.toLowerCase().trim();

  // Natural language dates
  if (dateString === 'today') return today.toISOString().split('T')[0];
  if (dateString === 'tomorrow') return tomorrow.toISOString().split('T')[0];

  // Day names (next occurrence)
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayIndex = days.indexOf(dateString);
  if (dayIndex !== -1) {
    const targetDate = new Date(today);
    const daysUntilTarget = (dayIndex - today.getDay() + 7) % 7;
    targetDate.setDate(today.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
    return targetDate.toISOString().split('T')[0];
  }

  // Various date formats
  const dateFormats = [
    /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/,  // DD-MM-YYYY or DD/MM/YYYY
    /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/,  // YYYY-MM-DD
    /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2})$/,  // DD-MM-YY
    /^(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i, // DD MMM
  ];

  for (const format of dateFormats) {
    const match = dateStr.match(format);
    if (match) {
      if (format === dateFormats[1]) { // YYYY-MM-DD
        return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
      } else if (format === dateFormats[2]) { // DD-MM-YY
        const year = parseInt(match[3]);
        const fullYear = year < 50 ? 2000 + year : 1900 + year;
        return `${fullYear}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
      } else if (format === dateFormats[3]) { // DD MMM
        const months = {
          jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
          jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
        };
        const month = months[match[2].toLowerCase()];
        return `${today.getFullYear()}-${month}-${match[1].padStart(2, '0')}`;
      } else { // DD-MM-YYYY
        return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
      }
    }
  }

  return dateStr;
}

// Enhanced reservation details extraction
function extractReservationDetails(message) {
  const details = {};
  const lowerMessage = message.toLowerCase();

  // Enhanced date extraction
  const datePatterns = [
    /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/,
    /(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/,
    /(today|tomorrow)/i,
    /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i
  ];

  for (const pattern of datePatterns) {
    const match = message.match(pattern);
    if (match) {
      details.date = parseDate(match[1]);
      break;
    }
  }

  // Enhanced time extraction
  const timePatterns = [
    /(\d{1,2}):(\d{2})\s*(am|pm)/i,
    /(\d{1,2})\s*(am|pm)/i,
    /(\d{1,2}):(\d{2})/,
    /(noon|midnight)/i,
    /(evening|morning|afternoon|night)/i
  ];

  for (const pattern of timePatterns) {
    const match = message.match(pattern);
    if (match) {
      if (match[0].toLowerCase() === 'noon') {
        details.time = '12:00';
      } else if (match[0].toLowerCase() === 'midnight') {
        details.time = '00:00';
      } else if (match[0].toLowerCase().includes('evening')) {
        details.time = '19:00';
      } else if (match[0].toLowerCase().includes('morning')) {
        details.time = '09:00';
      } else if (match[0].toLowerCase().includes('afternoon')) {
        details.time = '14:00';
      } else if (match[0].toLowerCase().includes('night')) {
        details.time = '20:00';
      } else {
        const hour = match[1];
        const minute = match[2] || '00';
        const period = match[3] || '';
        details.time = to24Hour(`${hour}:${minute}${period}`);
      }
      break;
    }
  }

  // Enhanced party size extraction
  const partySizePatterns = [
    /(\d+)\s*(people|person|pax|guests?|adults?)/i,
    /for\s+(\d+)/i,
    /(\d+)\s*of\s*us/i,
    /party\s*of\s*(\d+)/i,
    /table\s*for\s*(\d+)/i
  ];

  for (const pattern of partySizePatterns) {
    const match = message.match(pattern);
    if (match) {
      details.partySize = parseInt(match[1]);
      break;
    }
  }

  // Enhanced restaurant extraction
  const restaurantPatterns = [
    /(at|for|in)\s+([a-zA-Z\s&]+?)(?:\s+on|\s+for|\s+at|$)/i,
    /restaurant\s*[:]\s*([a-zA-Z\s&]+)/i
  ];

  for (const pattern of restaurantPatterns) {
    const match = message.match(pattern);
    if (match && match[2].trim().length > 2) {
      details.restaurant = match[2].trim();
      break;
    }
  }

  return details;
}

// Enhanced change detection
function detectChangeIntent(message) {
  const changePatterns = [
    /change\s+(the\s+)?(date|time|party\s*size|people|persons|restaurant|table)/i,
    /modify\s+(the\s+)?(date|time|party\s*size|people|persons|restaurant|table)/i,
    /update\s+(the\s+)?(date|time|party\s*size|people|persons|restaurant|table)/i,
    /different\s+(date|time|restaurant)/i,
    /another\s+(date|time|restaurant)/i,
    /make\s+it\s+(\d+)/i,
    /instead\s+of/i,
    /not\s+(\d+)/i,
    /actually/i,
    /wait,/i,
    /correction/i
  ];

  return changePatterns.some(pattern => pattern.test(message));
}

// Enhanced category matching
function fuzzyCategory(categories, userInput) {
  if (!Array.isArray(categories) || !userInput) return null;

  const cleanedInput = userInput.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const inputWords = cleanedInput.split(/\s+/);

  let best = null, bestScore = 0;

  for (const cat of categories) {
    const cleanedCat = cat.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    const catWords = cleanedCat.split(/\s+/);

    let score = 0;

    // Exact match
    if (cleanedCat === cleanedInput) return cat;

    // Substring matching
    if (cleanedCat.includes(cleanedInput) || cleanedInput.includes(cleanedCat)) {
      score += 100;
    }

    // Word matching
    for (const inputWord of inputWords) {
      for (const catWord of catWords) {
        if (catWord === inputWord) score += 30;
        else if (catWord.includes(inputWord) || inputWord.includes(catWord)) score += 10;
      }
    }

    if (score > bestScore) {
      best = cat;
      bestScore = score;
    }
  }

  // Accept category if score meets or exceeds 20
  return bestScore >= 20 ? best : null;
}

// Enhanced table availability check
async function findAvailableTable(restaurantId, date, time, partySize) {
  try {
    const tablesRes = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/tables?restaurantId=${restaurantId}`);
    const tablesData = await tablesRes.json();

    if (!Array.isArray(tablesData)) return null;

    // Find tables that can accommodate the party size
    const suitableTables = tablesData.filter(table => table.capacity >= partySize);

    // Sort by capacity (prefer smaller tables for efficiency)
    suitableTables.sort((a, b) => a.capacity - b.capacity);

    // Check availability for each suitable table
    for (const table of suitableTables) {
      const availRes = await fetch(
        `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/tables/availability?restaurantId=${restaurantId}&date=${date}&time=${time}&partySize=${partySize}&tableId=${table._id}`
      );
      const availData = await availRes.json();

      if (availData.available) {
        return table;
      }
    }

    return null;
  } catch (error) {
    console.error("Error finding available table:", error);
    return null;
  }
}

// Enhanced order ID extraction (updated to match old version)
function extractOrderId(message) {
  const orderPatterns = [
    /(track|status|check|want\s+to\s+track)\s+(order|my\s+order)[\s:]*(.*)/i,
    /where\s+(is\s+)?(my\s+)?order[\s#:]*(.*)/i,
    /^(order\s*[:#]?\s*)?([A-Z]{2,3}-?\d{4,}|\d{8,}|[A-Z0-9]{8,}-[A-Z0-9]{4,}|#?ORD-\d{8}-\d{4}|[a-f0-9]{24})$/i,
    /#?ORD-\d{8}-\d{4}/i,
    /[A-Z]{2,3}\d{6,}/i,
    /[a-f0-9]{24}/i
  ];

  for (const pattern of orderPatterns) {
    const match = message.match(pattern);
    if (match) {
      // Return the most specific match group
      if (match[3] && match[3].trim()) {
        return match[3].trim();
      }
      if (match[2]) {
        const candidate = match[2].trim();
        // Ignore generic words like "order" or "my order"
        if (!/^\s*(order|my\s+order)\s*$/i.test(candidate)) {
          return candidate;
        }
      }
      // Only return full match if it looks like a real ID (alphanumeric 6+ or formatted with dashes)
      const full = match[0].trim();
      if (/^[A-Za-z0-9-]{6,}$/.test(full)) {
        return full;
      }
      // Otherwise continue searching other patterns
      continue;
    }
  }

  return null;
}

const PAYMENT_ACCOUNTS = {
  easypaisa: "03451234567",
  jazzcash: "03001234567",
  nayapay: "03111234567",
  sadapay: "03221234567",
  allied: "PK12ALLIED000123456789",
  cash: "Cash on Delivery"
};

// Enhanced intelligent response system
class ChatbotIntelligence {
  static detectIntent(message) {
    const intents = {
      greeting: /\b(hi|hello|hey|salaam|good\s*(?:morning|afternoon|evening))\b/i,
      menu: /(show\s*(me\s*)?(the\s*)?(complete\s*|full\s*)?menus?|^menus?$|what.*food.*available)/i,
      categories: /(show\s*(me\s*)?(all\s*)?(the\s*)?categories|^categories$)/i,
      reservation: /(book|reserve|table|reservation|seat)/i,
      tracking: /(track|status|check|where.*order|order.*status)/i,
      payment: /(pay|payment|paid|transaction|easypaisa|jazzcash|nayapay|sadapay|allied|cash)/i,
      recommendation: /(show\s*(me\s*)?(most\s*)?(popular|bestseller|best\s*selling)|^popular|^bestsellers?)/i,
      order: /(order|buy|purchase|want|get|add.*cart)/i,
      cancel: /(cancel|remove|delete|stop)/i,
      help: /(^help$|^how|what.*can.*you.*do|instructions)/i
    };

    const detected = [];
    for (const [intent, pattern] of Object.entries(intents)) {
      if (pattern.test(message)) {
        detected.push(intent);
      }
    }

    return detected;
  }

  static generateContextualResponse(intents, context) {
    if (intents.includes('greeting')) {
      const greetings = [
        "Hello! Welcome to our restaurant! How can I help you today?",
        "Hi there! I'm your AI assistant. What would you like to do today?",
        "Welcome! I can help you with reservations, orders, menu, and tracking. What interests you?"
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }

    if (intents.includes('help')) {
      return `I'm here to help! Here's what I can do for you:

🍽️ **Menu & Food**
• "Show menu" - See our complete menu
• "Show categories" - Browse food categories
• "Show [category]" - View items in a category

📋 **Orders**
• "I want [dish name]" - Place an order
• "Track order [ID]" - Check order status
• "Popular dishes" - See bestsellers

🪑 **Reservations**
• "Book a table" - Make a reservation
• "Reserve for [X] people at [time]" - Quick booking

💳 **Payments**
• Support for EasyPaisa, JazzCash, NayaPay, SadaPay, Allied Bank, and Cash

Just ask me naturally! For example: "Book a table for 4 people tomorrow at 7 PM" or "Show me rice dishes"`;
    }

    return null;
  }
}

export async function POST(request) {
  let gemini;
  try {
    gemini = (await import("@/lib/gemini")).default;
  } catch (error) {
    console.error("Failed to import Gemini:", error.message);
    return NextResponse.json({
      reply: "🤖 AI assistant is temporarily unavailable. Please try again in a moment or contact support."
    });
  }

  try {
    const body = await request.json();
    const {
      message,
      userProfile = {},
      lastSuggestion = {},
      pendingOrder = {},
      pendingPayment = {},
      suggestTime,
      pendingReservationRequest,
      pendingReservation
    } = body;

    if (!message) {
      return NextResponse.json({
        error: "Message is required",
        reply: "I didn't receive your message. Please try again!"
      }, { status: 400 });
    }

    // Clean message for better matching
    const cleanMessage = message.toLowerCase().trim();
    // Remove common polite filler words to improve intent matching
    const politeRegex = /\b(?:plz|pls|please|thanks|thank\s*you|thankyou)\b/gi;
    const matchMessage = cleanMessage.replace(politeRegex, '').replace(/\s{2,}/g, ' ').trim();

    // Detect user intents for smarter responses
    const detectedIntents = ChatbotIntelligence.detectIntent(message);
    const contextualResponse = ChatbotIntelligence.generateContextualResponse(detectedIntents, {
      pendingOrder, pendingReservation, pendingReservationRequest
    });

    // Check for specific intents first before general help
    if (detectedIntents.includes('menu') || detectedIntents.includes('categories') || detectedIntents.includes('recommendation')) {
      // Skip contextual response for these - let specific handlers deal with them
    } else if (contextualResponse) {
      return NextResponse.json({
        reply: contextualResponse,
        ...(pendingOrder && { pendingOrder }),
        ...(pendingReservation && { pendingReservation }),
        ...(pendingReservationRequest && { pendingReservationRequest })
      });
    }

    // Fetch context data
    const [restaurantsRes, categoriesRes, itemsRes] = await Promise.all([
      fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/restaurants`).catch(() => ({ json: () => [] })),
      fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/categories`).catch(() => ({ json: () => [] })),
      fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/items`).catch(() => ({ json: () => [] }))
    ]);

    const restaurants = await restaurantsRes.json();
    const categories = await categoriesRes.json();
    const items = await itemsRes.json();

    // ===== QUICK HANDLERS FOR GENERIC MENU / CATEGORY QUERIES =====
    const quickMenuPatterns = [
      /^(show|see|view|explore|display|list|want\s*to\s*see)\s*(me\s*)?(the\s*)?(complete\s*|full\s*)?(menu|menus)\s*$/i,
      /^(menu|menus)$/i
    ];

    const quickCategoryPatterns = [
      /^(show|see|view|explore|display|list|want\s*to\s*see)\s*(me\s*)?(all\s*)?(the\s*)?categories?\s*$/i,
      /^(categories?)$/i
    ];

    const isQuickMenuRequest = quickMenuPatterns.some(p => p.test(cleanMessage));
    const isQuickCategoryRequest = quickCategoryPatterns.some(p => p.test(cleanMessage));

    if (isQuickMenuRequest || isQuickCategoryRequest) {
      const catList = categories.map(cat => {
        const catItemCount = items.filter(i => String(i.category) === String(cat._id)).length;
        return `• ${cat.name} (${catItemCount} items)`;
      }).join("\n");

      return NextResponse.json({
        reply: `📋 **Our Menu Categories**\n\n${catList}\n\n👉 Say "Show [category]" to see its items!`,
        ...(pendingOrder && { pendingOrder }),
        ...(pendingReservation && { pendingReservation }),
        ...(pendingReservationRequest && { pendingReservationRequest })
      });
    }

    // ============================================
    // CRITICAL FIX: HANDLE SPECIAL REQUESTS FIRST
    
    // Pattern arrays for special requests
    const popularPatterns = [
      /^(show\s*)?(me\s*)?(most\s*)?(popular|bestseller|best\s*selling|top)\s*(dishes?|items?|food)?$/i,
      /^(what\s*(are\s*)?)(the\s*)?(most\s*)?(popular|bestseller|best\s*selling|top)\s*(dishes?|items?|food)?$/i,
      /^popular\s*(dishes?|items?|food)?$/i,
      /^bestsellers?$/i,
      /^top\s*(dishes?|items?|food)?$/i,
      /^(most\s*)?(ordered|frequent)\s*(dishes?|items?|food)?$/i
    ];

    const specialPatterns = [
      /^(show\s*)?(me\s*)?(special|specialty|chef\s*special|house\s*special)\s*(dishes?|items?|food)?$/i,
      /^(what\s*(are\s*)?)(the\s*)?(special|specialty|chef\s*special|house\s*special)\s*(dishes?|items?|food)?$/i,
      /^special\s*(dishes?|items?|food)?$/i,
      /^specialty$/i,
      /^chef\s*specials?$/i,
      /^house\s*specials?$/i
    ];

    const suggestionPatterns = [
      /(can|could|would)\s+(you\s+)?(please\s+)?(suggest|recommend)\s+(me\s+)?(any\s+)?(dish|food|item)/i,
      /\bsuggest\b.*\b(dish|food|something)\b/i,
      /recommend\s+(me\s+)?(a\s+)?(dish|food|something)/i,
      /(any\s+)?(recommendations?|suggestions?)\b/i
    ];

    const isSuggestionRequest = suggestionPatterns.some(p => p.test(matchMessage));

    if (isSuggestionRequest) {
      if (!Array.isArray(items)) {
        return NextResponse.json({ reply: "Sorry, menu items are currently unavailable." });
      }
      // Pick 3 random items to suggest (or fewer if not enough)
      const shuffled = [...items].sort(() => 0.5 - Math.random());
      const suggestions = shuffled.slice(0, Math.min(3, items.length));
      const suggestionText = suggestions
        .map((item, idx) => `${idx + 1}. 🍽️ **${item.name}**${item.price ? ` - Rs. ${item.price}` : ''}`)
        .join('\n');
      return NextResponse.json({
        reply: `🤔 Here are some dishes you might like:\n\n${suggestionText}\n\nLet me know if any of these interest you!`
      });
    }

    const mostRepeatedPatterns = [
      /^(show\s*)?(me\s*)?(most\s*)?(repeated|frequent|common|regular)\s*(dishes?|items?|food)?$/i,
      /^(what\s*(are\s*)?)(the\s*)?(most\s*)?(repeated|frequent|common|regular)\s*(dishes?|items?|food)?$/i,
      /^most\s*repeated\s*(dishes?|items?|food)?$/i,
      /^frequent\s*(dishes?|items?|food)?$/i,
      /^common\s*(dishes?|items?|food)?$/i,
      /^regular\s*(dishes?|items?|food)?$/i
    ];

    // Check for different request types
    const isPopularRequest = popularPatterns.some(pattern => pattern.test(cleanMessage));
    const isSpecialRequest = specialPatterns.some(pattern => pattern.test(cleanMessage));
    const isMostRepeatedRequest = mostRepeatedPatterns.some(pattern => pattern.test(cleanMessage));

    // Handle Popular Dishes FIRST
    if (isPopularRequest) {
      try {
        const recRes = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/recommendations`);
        const recData = await recRes.ok ? await recRes.json() : null;

        let recommendedItems = [];
        if (recData && recData.success && Array.isArray(recData.recommendations)) {
          recommendedItems = recData.recommendations;
        } else {
          // Fallback: Use local popularity data if API fails
          recommendedItems = items
            .filter(item => item.orderCount > 0)
            .sort((a, b) => (b.orderCount || 0) - (a.orderCount || 0))
            .slice(0, 5);
        }

        if (recommendedItems.length > 0) {
          const reply = `⭐ **Most Popular Dishes**\n\n` +
            recommendedItems
              .map((item, index) => `${index + 1}. ${item.name}${item.price ? ` (Rs. ${item.price})` : ""} — Ordered ${item.orderCount || 'many'} times`)
              .join("\n") +
            "\n\n🛒 Say \"I want [dish name]\" to order any of these!";

          return NextResponse.json({
            reply,
            ...(pendingOrder && { pendingOrder }),
            ...(pendingReservation && { pendingReservation }),
            ...(pendingReservationRequest && { pendingReservationRequest })
          });
        } else {
          return NextResponse.json({
            reply: "⭐ **Popular Dishes:**\n\n1. Chicken Biryani (Rs. 300)\n2. Bar-B-Q Pizza (Rs. 1050)\n3. Special Lamb Karhai (Rs. 3000)\n4. Zinger Burger (Rs. 249)\n5. Sajji (Rs. 1050)\n\n🛒 Say \"I want [dish name]\" to order!",
            ...(pendingOrder && { pendingOrder }),
            ...(pendingReservation && { pendingReservation }),
            ...(pendingReservationRequest && { pendingReservationRequest })
          });
        }
      } catch (error) {
        console.error("Error fetching popular dishes:", error);
        return NextResponse.json({
          reply: "⭐ **Popular Dishes:**\n\n1. Chicken Biryani (Rs. 300)\n2. Bar-B-Q Pizza (Rs. 1050)\n3. Special Lamb Karhai (Rs. 3000)\n4. Zinger Burger (Rs. 249)\n5. Sajji (Rs. 1050)\n\n🛒 Say \"I want [dish name]\" to order!",
          ...(pendingOrder && { pendingOrder }),
          ...(pendingReservation && { pendingReservation }),
          ...(pendingReservationRequest && { pendingReservationRequest })
        });
      }
    }

    // Handle Special Dishes FIRST
    if (isSpecialRequest) {
      try {
        // Filter items that have "special" in their name or are marked as special
        let specialItems = items.filter(item =>
          item.name.toLowerCase().includes('special') ||
          item.isSpecial === true ||
          item.category === 'Chef Special' ||
          item.price > 1000 // Assuming expensive items are specials
        );

        // If no special items found, create a curated list
        if (specialItems.length === 0) {
          specialItems = [
            { name: "Chef's Special Biryani", price: 450, description: "Our signature biryani recipe" },
            { name: "Special Lamb Karhai", price: 3000, description: "Premium lamb with special spices" },
            { name: "House Special Pizza", price: 1200, description: "Loaded with premium toppings" },
            { name: "Special Grilled Fish", price: 1500, description: "Fresh catch with special marinade" },
            { name: "Royal Chicken Tikka", price: 800, description: "Marinated in special yogurt blend" }
          ];
        }

        const reply = `✨ **Chef's Special Dishes**\n\n` +
          specialItems
            .slice(0, 5)
            .map((item, index) => `${index + 1}. ${item.name}${item.price ? ` (Rs. ${item.price})` : ""}${item.description ? ` — ${item.description}` : ""}`)
            .join("\n") +
          "\n\n🛒 Say \"I want [dish name]\" to order any of these specials!";

        return NextResponse.json({
          reply,
          ...(pendingOrder && { pendingOrder }),
          ...(pendingReservation && { pendingReservation }),
          ...(pendingReservationRequest && { pendingReservationRequest })
        });
      } catch (error) {
        console.error("Error fetching special dishes:", error);
        return NextResponse.json({
          reply: "✨ **Chef's Special Dishes:**\n\n1. Chef's Special Biryani (Rs. 450)\n2. Special Lamb Karhai (Rs. 3000)\n3. House Special Pizza (Rs. 1200)\n4. Special Grilled Fish (Rs. 1500)\n5. Royal Chicken Tikka (Rs. 800)\n\n🛒 Say \"I want [dish name]\" to order!",
          ...(pendingOrder && { pendingOrder }),
          ...(pendingReservation && { pendingReservation }),
          ...(pendingReservationRequest && { pendingReservationRequest })
        });
      }
    }

    // Handle Most Repeated Dishes FIRST
    if (isMostRepeatedRequest) {
      try {
        // Get items with highest order frequency
        let repeatedItems = items
          .filter(item => item.orderCount && item.orderCount > 2) // Items ordered more than twice
          .sort((a, b) => (b.orderCount || 0) - (a.orderCount || 0))
          .slice(0, 5);

        // If no repeated items found, use fallback
        if (repeatedItems.length === 0) {
          repeatedItems = [
            { name: "Chicken Biryani", price: 300, orderCount: 15 },
            { name: "Plain Rice", price: 150, orderCount: 12 },
            { name: "Zinger Burger", price: 249, orderCount: 10 },
            { name: "Chicken Karhai", price: 1200, orderCount: 8 },
            { name: "Fresh Juice", price: 120, orderCount: 7 }
          ];
        }

        const reply = `🔄 **Most Repeated Dishes**\n\n` +
          repeatedItems
            .map((item, index) => `${index + 1}. ${item.name}${item.price ? ` (Rs. ${item.price})` : ""} — Ordered ${item.orderCount || 'frequently'} times`)
            .join("\n") +
          "\n\n🛒 These are our customers' go-to favorites! Say \"I want [dish name]\" to order!";

        return NextResponse.json({
          reply,
          ...(pendingOrder && { pendingOrder }),
          ...(pendingReservation && { pendingReservation }),
          ...(pendingReservationRequest && { pendingReservationRequest })
        });
      } catch (error) {
        console.error("Error fetching most repeated dishes:", error);
        return NextResponse.json({
          reply: "🔄 **Most Repeated Dishes:**\n\n1. Chicken Biryani (Rs. 300) — 15 times\n2. Plain Rice (Rs. 150) — 12 times\n3. Zinger Burger (Rs. 249) — 10 times\n4. Chicken Karhai (Rs. 1200) — 8 times\n5. Fresh Juice (Rs. 120) — 7 times\n\n🛒 Say \"I want [dish name]\" to order!",
          ...(pendingOrder && { pendingOrder }),
          ...(pendingReservation && { pendingReservation }),
          ...(pendingReservationRequest && { pendingReservationRequest })
        });
      }
    }

    // ============================================
    // NOW HANDLE REGULAR MENU/CATEGORY REQUESTS
    // ============================================

    // Enhanced payment method and transaction ID detection
    const paymentMethodMatch = message.match(/(easypaisa|jazzcash|nayapay|sadapay|allied|cash(?:\s*on\s*delivery)?)/i);
    const transactionIdMatch = message.match(/(\d{6,})|([a-zA-Z0-9]{8,})/i);

    // 1. Show complete menu - FIXED: Better pattern matching
    const menuPatterns = [
      /^(show|see|view|explore|display|list|want\s*to\s*see)\s*(me\s*)?(the\s*)?(complete\s*|full\s*|entire\s*)?menus?$/i,
      /^(show|see|view|explore|display|list|want\s*to\s*see)\s*(me\s*)?(all\s*)?(the\s*)?(food\s*items?|items?|dishes?)$/i,
      /^(display\s*)?(the\s*)?menus?$/i,
      /^menus?$/i,
      /^(what\s*)?(food\s*)?(do\s*you\s*have|is\s*available)$/i,
      /^(i\s*)?(want\s*to\s*)?(see\s*)?(the\s*)?menus?$/i,
      /^(can\s*i\s*)?(see\s*)?(the\s*)?menus?$/i
    ];

    const isMenuRequest = menuPatterns.some(pattern => pattern.test(matchMessage));

    if (isMenuRequest) {
      if (!Array.isArray(categories) || !Array.isArray(items)) {
        return NextResponse.json({
          reply: "🍽️ I'm sorry, our menu is temporarily unavailable. Please try again in a moment or contact our staff directly.",
          ...(pendingOrder && { pendingOrder }),
          ...(pendingReservation && { pendingReservation }),
          ...(pendingReservationRequest && { pendingReservationRequest })
        });
      }

      const menuText = categories.map(cat => {
        const catItems = items
          .filter(i => String(i.category) === String(cat._id))
          .map(i => `  🔸 ${i.name}${i.price ? ` - Rs. ${i.price}` : ''}`)
          .join('\n');
        return `**${cat.name}**\n${catItems || '  No items available'}`;
      }).join('\n\n');

      const totalItems = items.length;
      const totalCategories = categories.length;

      return NextResponse.json({
        reply: `🍽️ **Complete Menu** (${totalCategories} categories, ${totalItems} items)\n\n${menuText}\n\n✨ Ask me "I want [dish name]" to place an order!`,
        ...(pendingOrder && { pendingOrder }),
        ...(pendingReservation && { pendingReservation }),
        ...(pendingReservationRequest && { pendingReservationRequest })
      });
    }

    // 2. Show categories - FIXED: More precise detection
    const categoryPatterns = [
      /^(show\s*)?(me\s*)?(all\s*)?(the\s*)?(food\s*)?categories$/i,
      /^(show\s*)?(me\s*)?(all\s*)?(the\s*)?(food\s*)?category$/i,
      /^(what\s*)?(food\s*)?(categories|types|kinds|sections)\s*(are\s*available|do\s*you\s*have)?$/i,
      /^categories$/i,
      /^category$/i,
      /^(food\s*)?(types?|kinds?)$/i,
      /^(i\s*)?(want\s*to\s*)?(see\s*)?(the\s*)?categories$/i
    ];

    const isCategoryRequest = categoryPatterns.some(pattern => pattern.test(matchMessage));

    if (isCategoryRequest) {
      if (!Array.isArray(categories)) {
        return NextResponse.json({
          reply: "📂 Categories are temporarily unavailable. Please try again later.",
          ...(pendingOrder && { pendingOrder }),
          ...(pendingReservation && { pendingReservation }),
          ...(pendingReservationRequest && { pendingReservationRequest })
        });
      }

      const categoriesText = categories
        .map((cat, index) => `${index + 1}. 🍽️ **${cat.name}**`)
        .join('\n');

      return NextResponse.json({
        reply: `📂 **Food Categories**\n\n${categoriesText}\n\n💡 Say "Show [category name]" to see items in any category!\nExample: "Show Rice" or "Show Fast-Food"`,
        ...(pendingOrder && { pendingOrder }),
        ...(pendingReservation && { pendingReservation }),
        ...(pendingReservationRequest && { pendingReservationRequest })
      });
    }

    // 3. Show specific category items - NOW RUNS AFTER SPECIAL REQUESTS
    const categoryItemPatterns = [
      /^(what\s*(is|are)\s*(in|inside|on)\s*(the\s*)?([a-zA-Z\s-]+?)\s+category)\??$/i, // e.g., "what is in fish category?"
      /^in\s*(the\s*)?([a-zA-Z\s-]+?)\s+category\??$/i,                                 // e.g., "in fish category"
      /^(show\s*)?(me\s*)?(items\s*in\s*)?([a-zA-Z\s-]+?)(\s+(items|dishes|menu|food))?$/i,
      /^(display\s*)?([a-zA-Z\s-]+?)\s+(items|dishes|menu|food)$/i,
      /^(i\s*)?(want\s*to\s*see|see)\s+([a-zA-Z\s-]+?)\s+(category|section)$/i,
      /^([a-zA-Z\s-]+?)\s+(category|section)$/i
    ];

    let categoryMatch = null;
    // Only check for category items if it's not a menu or category list request
    if (!isMenuRequest && !isCategoryRequest) {
      for (const pattern of categoryItemPatterns) {
        const match = matchMessage.match(pattern);
        if (match) {
          categoryMatch = match;
          break;
        }
      }
    }

    if (categoryMatch) {
      // Dynamically detect category name from capture groups
      const extractedGroups = categoryMatch.slice(1).filter(Boolean);
      let categoryName = '';
      for (const grp of extractedGroups) {
        const trimmed = grp.trim();
        // Ignore generic words
        if (!/^(items?|dishes?|menu|food|category|section|show|see|want|to|in|inside|on|what|is|are|i|my)$/i.test(trimmed)) {
          categoryName = trimmed;
          break;
        }
      }
      if (!categoryName) categoryName = extractedGroups[0]?.trim() || '';

      // CRITICAL: Skip special requests that got here accidentally
      const specialKeywords = ['popular', 'special', 'repeated', 'frequent', 'bestseller', 'top', 'common', 'regular'];
      const isSpecialKeyword = specialKeywords.some(keyword => categoryName.toLowerCase().includes(keyword));
      
      if (isSpecialKeyword) {
        // Let it fall through to other handlers or Gemini
      } else {
        // Skip if it's a general menu/category request or contains menu-related keywords
        const skipKeywords = ['menu', 'menus', 'categories', 'category', 'items', 'dishes', 'dish', 'food', 'see', 'want', 'show', 'suggest', 'recommend', 'any', 'order', 'track', 'status', 'my', 'reservation', 'reserve', 'booking', 'book', 'table', 'seat'];
        const shouldSkip = skipKeywords.some(keyword => categoryName.toLowerCase().includes(keyword)) ||
          categoryName.split(' ').some(word => skipKeywords.includes(word.toLowerCase()));

        if (!shouldSkip) {
          const matchedCategory = fuzzyCategory(categories, categoryName);

          if (matchedCategory) {
            const catItems = items
              .filter(i => String(i.category) === String(matchedCategory._id))
              .map((item, index) => `${index + 1}. 🔸 ${item.name}${item.price ? ` - **Rs. ${item.price}**` : ''}`)
              .join('\n');

            const itemCount = items.filter(i => String(i.category) === String(matchedCategory._id)).length;

            return NextResponse.json({
              reply: `🍽️ **${matchedCategory.name}** (${itemCount} items)\n\n${catItems || 'No items available in this category.'}\n\n🛒 Order by saying "I want [item name]"!`,
              ...(pendingOrder && { pendingOrder }),
              ...(pendingReservation && { pendingReservation }),
              ...(pendingReservationRequest && { pendingReservationRequest })
            });
          } else {
            const availableCategories = categories.map(cat => cat.name).join(', ');
            return NextResponse.json({
              reply: `❓ I couldn't find "${categoryName}" category. Available categories are:\n\n${availableCategories}\n\nPlease try one of these!`,
              ...(pendingOrder && { pendingOrder }),
              ...(pendingReservation && { pendingReservation }),
              ...(pendingReservationRequest && { pendingReservationRequest })
            });
          }
        }
      }
    }

    // === ORDER TRACKING SECTION ===
    const trackingMatch = message.match(/(track|status|check|want\s+to\s+track)\s+(order|my\s+order)[\s:]*(.*)/i) ||
      message.match(/where\s+(is\s+)?(my\s+)?order[\s#:]*(.*)/i) ||
      message.match(/^(order\s*[:#]?\s*)?([A-Z]{2,3}-?\d{4,}|\d{8,}|[A-Z0-9]{8,}-[A-Z0-9]{4,}|#?ORD-\d{8}-\d{4}|[a-f0-9]{24})$/i) ||
      message.match(/#?ORD-\d{8}-\d{4}/i) ||
      message.match(/[A-Z]{2,3}\d{6,}/i) ||
      message.match(/[a-f0-9]{24}/i);

    if (trackingMatch) {
      let orderId;
      if (trackingMatch[3]) {
        orderId = trackingMatch[3].trim();
      } else if (trackingMatch[2]) {
        orderId = trackingMatch[2].trim();
      } else if (trackingMatch[0]) {
        orderId = trackingMatch[0].trim();
      }

      // Clean up order ID
      if (orderId) {
        orderId = orderId.replace(/^#/, '').replace(/^order\s*[:#]?\s*/i, '');
      }

      // Only proceed if we have a valid-looking order ID
      if (orderId && (orderId.length >= 6 || /^[a-f0-9]{24}$/i.test(orderId))) {
        try {
          const trackRes = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/track-order?orderId=${encodeURIComponent(orderId)}`);
          const trackData = await trackRes.json();

          if (trackRes.ok && !trackData.error) {
            const statusEmoji = {
              'pending': '⏳',
              'confirmed': '✅',
              'preparing': '👨‍🍳',
              'ready': '🍽️',
              'delivered': '✅',
              'cancelled': '❌'
            };

            const emoji = statusEmoji[trackData.status?.toLowerCase()] || '📋';

            return NextResponse.json({
              reply: `${emoji} **Order Status**\n\nOrder ID: ${trackData._id || orderId}\nOrder Number: ${trackData.orderNumber || 'N/A'}\nStatus: ${trackData.status || 'Unknown'}\nRestaurant: ${trackData.restaurantName || 'N/A'}\nTotal: Rs. ${trackData.totalPrice || 'N/A'}\nPayment Method: ${trackData.paymentMethod || 'N/A'}\n\nEstimated delivery time: ${trackData.estimatedDeliveryTime || '30-45 minutes'}`,
              ...(pendingOrder && { pendingOrder }),
              ...(pendingReservation && { pendingReservation }),
              ...(pendingReservationRequest && { pendingReservationRequest })
            });
          } else {
            return NextResponse.json({
              reply: `❌ Order not found. Please check your order ID/number "${orderId}" and try again.\n\n💡 **To track your order, provide a valid Order ID like:**\n• ORD-12345678-1234\n• ABC123456789\n• 60a7b2c3d4e5f6789a0b1c2d`,
              ...(pendingOrder && { pendingOrder }),
              ...(pendingReservation && { pendingReservation }),
              ...(pendingReservationRequest && { pendingReservationRequest })
            });
          }
        } catch (error) {
          console.error("Order tracking error:", error);
          return NextResponse.json({
            reply: "❌ Unable to track order at the moment. Please try again later.",
            ...(pendingOrder && { pendingOrder }),
            ...(pendingReservation && { pendingReservation }),
            ...(pendingReservationRequest && { pendingReservationRequest })
          });
        }
      } else {
        return NextResponse.json({
          reply: "Please provide your order ID or number to track your order. Thanks!\n\n💡 **Format examples:**\n• ORD-12345678-1234\n• ABC123456789\n• 60a7b2c3d4e5f6789a0b1c2d\n\nExample: \"Track order ORD-12345678-1234\"",
          ...(pendingOrder && { pendingOrder }),
          ...(pendingReservation && { pendingReservation }),
          ...(pendingReservationRequest && { pendingReservationRequest })
        });
      }
    }

    // === ENHANCED RESERVATION SYSTEM (updated to match old version) ===
    const reservationKeywords = /(book|reserve|table|reservation|seat|dining)/i;

    // Step 1: Detect reservation intent and collect data
    if (reservationKeywords.test(message) && !pendingReservation && !suggestTime) {
      // Try to extract reservation details from message
      const dateMatch = message.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|today|tomorrow)/i);
      const timeMatch = message.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
      const partySizeMatch = message.match(/(\d+)\s*(people|person|pax)/i);
      const restaurantMatch = message.match(/(at|for)\s+([a-zA-Z\s]+)/i);

      let missingInfo = [];
      const reservationData = {};

      if (dateMatch) {
        reservationData.date = parseDate(dateMatch[1]);
      } else {
        missingInfo.push("date (e.g., 2024-12-25 or tomorrow)");
      }

      if (timeMatch) {
        reservationData.time = to24Hour(`${timeMatch[1]}:${timeMatch[2] || '00'}${timeMatch[3] || ''}`);
      } else {
        missingInfo.push("time (e.g., 7:30 PM)");
      }

      if (partySizeMatch) {
        reservationData.partySize = parseInt(partySizeMatch[1]);
      } else {
        missingInfo.push("number of people");
      }

      if (restaurantMatch) {
        const foundRestaurant = fuzzyFind(restaurants, restaurantMatch[2]);
        reservationData.restaurant = foundRestaurant?.name || restaurantMatch[2];
        reservationData.restaurantId = foundRestaurant?._id;
      } else if (restaurants.length > 0) {
        reservationData.restaurant = restaurants[0].name;
        reservationData.restaurantId = restaurants[0]._id;
      }

      if (missingInfo.length > 0) {
        return NextResponse.json({
          reply: `I'd be happy to help you make a reservation! I need the following information:\n\n${missingInfo.map(info => `• ${info}`).join('\n')}\n\nPlease provide the missing details.`,
          pendingReservation: { step: 'collecting_info', data: reservationData },
          ...(pendingOrder && { pendingOrder }),
          ...(pendingReservationRequest && { pendingReservationRequest })
        });
      } else {
        // All info provided, move to confirmation step
        const foundRestaurant = fuzzyFind(restaurants, reservationData.restaurant) || restaurants[0];

        return NextResponse.json({
          reply: `Perfect! Let me confirm your reservation details:\n\n• Restaurant: ${foundRestaurant.name}\n• Date: ${reservationData.date}\n• Time: ${reservationData.time}\n• Party Size: ${reservationData.partySize} people\n\nWould you like me to check availability and proceed with this reservation?`,
          pendingReservation: {
            step: 'awaiting_confirmation',
            data: { ...reservationData, restaurant: foundRestaurant.name, restaurantId: foundRestaurant._id }
          },
          ...(pendingOrder && { pendingOrder }),
          ...(pendingReservationRequest && { pendingReservationRequest })
        });
      }
    }

    // Step 1.5: Handle missing info collection
    if (pendingReservation?.step === 'collecting_info') {
      const currentData = pendingReservation.data || {};

      // Extract new info from message
      const dateMatch = message.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|today|tomorrow)/i);
      const timeMatch = message.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
      const partySizeMatch = message.match(/(\d+)\s*(people|person|pax)/i);
      const restaurantMatch = message.match(/(at|for)\s+([a-zA-Z\s]+)/i);

      // Update data with new info
      if (dateMatch && !currentData.date) currentData.date = parseDate(dateMatch[1]);
      if (timeMatch && !currentData.time) {
        currentData.time = to24Hour(`${timeMatch[1]}:${timeMatch[2] || '00'}${timeMatch[3] || ''}`);
      }
      if (partySizeMatch && !currentData.partySize) {
        currentData.partySize = parseInt(partySizeMatch[1]);
      }
      if (restaurantMatch && !currentData.restaurant) {
        const foundRestaurant = fuzzyFind(restaurants, restaurantMatch[2]);
        if (foundRestaurant) {
          currentData.restaurant = foundRestaurant.name;
          currentData.restaurantId = foundRestaurant._id;
        }
      }

      // Check what's still missing
      let missingInfo = [];
      if (!currentData.date) missingInfo.push("date (e.g., 2024-12-25 or tomorrow)");
      if (!currentData.time) missingInfo.push("time (e.g., 7:30 PM)");
      if (!currentData.partySize) missingInfo.push("number of people");

      if (missingInfo.length > 0) {
        return NextResponse.json({
          reply: `I still need:\n\n${missingInfo.map(info => `• ${info}`).join('\n')}\n\nPlease provide the missing details.`,
          pendingReservation: { step: 'collecting_info', data: currentData },
          ...(pendingOrder && { pendingOrder }),
          ...(pendingReservationRequest && { pendingReservationRequest })
        });
      } else {
        // All info collected, move to confirmation
        const foundRestaurant = fuzzyFind(restaurants, currentData.restaurant) || restaurants[0];

        return NextResponse.json({
          reply: `Perfect! Let me confirm your reservation details:\n\n• Restaurant: ${foundRestaurant.name}\n• Date: ${currentData.date}\n• Time: ${currentData.time}\n• Party Size: ${currentData.partySize} people\n\nWould you like me to check availability and proceed with this reservation?`,
          pendingReservation: {
            step: 'awaiting_confirmation',
            data: { ...currentData, restaurant: foundRestaurant.name, restaurantId: foundRestaurant._id }
          },
          ...(pendingOrder && { pendingOrder }),
          ...(pendingReservationRequest && { pendingReservationRequest })
        });
      }
    }

    // Step 2: Handle initial confirmation and check availability
    if (pendingReservation?.step === 'awaiting_confirmation' && /(yes|correct|confirm|proceed|go ahead)/i.test(message)) {
      const reservationData = pendingReservation.data;

      try {
        // Find an available table first
        const availableTable = await findAvailableTable(
          reservationData.restaurantId,
          reservationData.date,
          reservationData.time,
          reservationData.partySize
        );

        if (availableTable) {
          const paymentOptions = Object.keys(PAYMENT_ACCOUNTS).map(method =>
            `• **${method.charAt(0).toUpperCase() + method.slice(1)}**: ${PAYMENT_ACCOUNTS[method]}`
          ).join('\n');

          return NextResponse.json({
            reply: `✅ Great news! Table ${availableTable.number} (capacity: ${availableTable.capacity}) is available at ${reservationData.restaurant} on ${reservationData.date} at ${reservationData.time}.\n\nTo confirm your reservation, please make a payment of Rs. 500 (reservation fee) using any of these methods:\n\n${paymentOptions}\n\nAfter payment, please share:\n1. Payment method used\n2. Transaction ID\n\nFormat: "easypaisa 1234567890" or "cash on delivery"`,
            pendingReservation: {
              step: 'payment',
              data: { ...reservationData, table: availableTable._id, tableNumber: availableTable.number }
            },
            ...(pendingOrder && { pendingOrder }),
            ...(pendingReservationRequest && { pendingReservationRequest })
          });
        } else {
          return NextResponse.json({
            reply: `❌ Sorry, no tables are available at ${reservationData.restaurant} for ${reservationData.partySize} people on ${reservationData.date} at ${reservationData.time}.\n\nWould you like me to suggest available times?`,
            pendingReservationRequest: {
              restaurant: reservationData.restaurant,
              restaurantId: reservationData.restaurantId,
              date: reservationData.date,
              partySize: reservationData.partySize
            },
            pendingReservation: null,
            ...(pendingOrder && { pendingOrder })
          });
        }
      } catch (error) {
        console.error("Availability check error:", error);
        return NextResponse.json({
          reply: "❌ Unable to check availability at the moment. Please try again later.",
          ...(pendingOrder && { pendingOrder }),
          ...(pendingReservationRequest && { pendingReservationRequest })
        });
      }
    }

    // Step 3: Handle reservation payment and completion
    if (pendingReservation?.step === 'payment') {
      const paymentMethodMatch = message.match(/(easypaisa|jazzcash|nayapay|sadapay|allied|cash)/i);
      const transactionIdMatch = message.match(/(\d{6,})/i) || message.match(/(cash\s*on\s*delivery)/i);

      if (paymentMethodMatch && transactionIdMatch) {
        const paymentMethod = paymentMethodMatch[1].toLowerCase();
        const transactionId = transactionIdMatch[1];
        const reservationData = pendingReservation.data;

        try {
          // Format date properly
          let formattedDate = reservationData.date;
          if (reservationData.date === 'today') {
            formattedDate = new Date().toISOString().split('T')[0];
          } else if (reservationData.date === 'tomorrow') {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            formattedDate = tomorrow.toISOString().split('T')[0];
          }

          // Create reservation payload with all required fields
          const reservationPayload = {
            restaurantId: reservationData.restaurantId,
            restaurantSlug: reservationData.restaurantSlug || 'dawat-restaurant',
            date: formattedDate,
            time: reservationData.time,
            persons: reservationData.partySize,
            table: reservationData.table, // This should be set from the availability check
            customerEmail: userProfile?.email || "guest@example.com",
            source: "chatbot",
            status: "Confirmed",
            paymentMethod: paymentMethod,
            transactionId: transactionId,
            paymentAmount: 500 // Reservation fee
          };

          // Call reservation API
          const reservationRes = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/reservations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reservationPayload)
          });

          const reservationResult = await reservationRes.json();

          if (reservationRes.ok && reservationResult._id) {
            return NextResponse.json({
              reply: `🎉 **Reservation Confirmed!**\n\nReservation ID: ${reservationResult._id}\nTable: ${reservationData.tableNumber || 'Assigned'}\nRestaurant: ${reservationData.restaurant}\nDate: ${formattedDate}\nTime: ${reservationData.time}\nParty Size: ${reservationData.partySize} people\nPayment: ${paymentMethod.toUpperCase()} - ${transactionId}\n\nThank you! Your table is reserved. Please arrive on time.`,
              pendingReservation: null,
              reservationId: reservationResult._id,
              ...(pendingOrder && { pendingOrder }),
              ...(pendingReservationRequest && { pendingReservationRequest })
            });
          } else {
            console.error("Reservation creation failed:", reservationResult);
            return NextResponse.json({
              reply: `❌ Failed to confirm reservation: ${reservationResult.error || 'Unknown error'}. Please try again or contact support.`,
              pendingReservation,
              ...(pendingOrder && { pendingOrder }),
              ...(pendingReservationRequest && { pendingReservationRequest })
            });
          }
        } catch (error) {
          console.error("Reservation creation error:", error);
          return NextResponse.json({
            reply: "❌ Unable to process reservation at the moment. Please try again later.",
            pendingReservation,
            ...(pendingOrder && { pendingOrder }),
            ...(pendingReservationRequest && { pendingReservationRequest })
          });
        }
      } else {
        return NextResponse.json({
          reply: "Please provide both payment method and transaction ID in this format:\n\n**PaymentMethod TransactionID**\n\nExample: easypaisa 1234567890\n\nOr type: cash on delivery",
          pendingReservation,
          ...(pendingOrder && { pendingOrder }),
          ...(pendingReservationRequest && { pendingReservationRequest })
        });
      }
    }

    // Step 4: Suggest available times
    if (suggestTime && pendingReservationRequest) {
      const { date, partySize, restaurant, restaurantId } = pendingReservationRequest;
      const times = [];
      for (let h = 12; h <= 22; h++) {
        times.push(`${h.toString().padStart(2, "0")}:00`);
        times.push(`${h.toString().padStart(2, "0")}:30`);
      }

      const availableTimes = [];
      for (const time of times) {
        try {
          const availableTable = await findAvailableTable(restaurantId, date, time, partySize);
          if (availableTable) {
            availableTimes.push(time);
          }
        } catch (error) {
          console.error("Error checking availability:", error);
        }
      }

      if (availableTimes.length > 0) {
        return NextResponse.json({
          reply: `Here are available times for ${partySize} people at ${restaurant} on ${date}:\n\n${availableTimes.map(time => `• ${time}`).join('\n')}\n\nPlease select a time by saying "book at [time]" (e.g., "book at 19:00")`,
          pendingReservationRequest: { ...pendingReservationRequest, availableTimes },
          ...(pendingOrder && { pendingOrder })
        });
      } else {
        return NextResponse.json({
          reply: `❌ Sorry, there are no available tables for ${partySize} people at ${restaurant} on ${date}. Please try a different date.`,
          ...(pendingOrder && { pendingOrder })
        });
      }
    }

    // Handle time selection from suggested times
    if (pendingReservationRequest?.availableTimes && /(book|reserve)\s*at\s*(\d{1,2}):?(\d{2})/i.test(message)) {
      const timeMatch = message.match(/(\d{1,2}):?(\d{2})/);
      const selectedTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2] || '00'}`;

      if (pendingReservationRequest.availableTimes.includes(selectedTime)) {
        return NextResponse.json({
          reply: `✅ Perfect! Table for ${pendingReservationRequest.partySize} people at ${pendingReservationRequest.restaurant} on ${pendingReservationRequest.date} at ${selectedTime} is available.\n\nWould you like to proceed with this reservation?`,
          pendingReservation: {
            step: 'awaiting_confirmation',
            data: {
              restaurant: pendingReservationRequest.restaurant,
              restaurantId: pendingReservationRequest.restaurantId,
              date: pendingReservationRequest.date,
              time: selectedTime,
              partySize: pendingReservationRequest.partySize
            }
          },
          pendingReservationRequest: null,
          ...(pendingOrder && { pendingOrder })
        });
      } else {
        return NextResponse.json({
          reply: `❌ Sorry, ${selectedTime} is not available. Please choose from the suggested times.`,
          ...(pendingOrder && { pendingOrder })
        });
      }
    }

    // --- EXISTING ORDER AND RECOMMENDATION LOGIC ---

    // Recommendation fallback: Most repeated/ordered/selling dishes
    // === MOST POPULAR/REPEATED DISHES SECTION ===
    if (/(most\s*(repeated|frequent|ordered|popular|selling|bestseller)|best\s*(selling|seller|ordered|popular))/i.test(message)) {
      try {
        // Get recommendations from API or use local data
        const recRes = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/recommendations`);
        const recData = await recRes.ok ? await recRes.json() : null;

        let recommendedItems = [];
        if (recData && recData.success && Array.isArray(recData.recommendations)) {
          recommendedItems = recData.recommendations;
        } else {
          // Fallback: Use local popularity data if API fails
          recommendedItems = items
            .filter(item => item.orderCount > 0)
            .sort((a, b) => (b.orderCount || 0) - (a.orderCount || 0))
            .slice(0, 3);
        }

        if (recommendedItems.length > 0) {
          const reply = `Here are our most popular dishes based on orders:\n\n` +
            recommendedItems
              .map(item => `⭐ ${item.name}${item.price ? ` (Rs. ${item.price})` : ""} — Ordered ${item.orderCount || 'many'} times`)
              .join("\n");

          return NextResponse.json({
            reply,
            ...(pendingOrder && { pendingOrder }),
            ...(pendingReservation && { pendingReservation }),
            ...(pendingReservationRequest && { pendingReservationRequest })
          });
        } else {
          return NextResponse.json({
            reply: "Our most popular dishes aren't available right now. Would you like to see our full menu instead?",
            ...(pendingOrder && { pendingOrder }),
            ...(pendingReservation && { pendingReservation }),
            ...(pendingReservationRequest && { pendingReservationRequest })
          });
        }
      } catch (error) {
        console.error("Error fetching popular dishes:", error);
        return NextResponse.json({
          reply: "I couldn't retrieve our most popular dishes at the moment. Here are some customer favorites:\n\n• Chicken Biryani\n• Bar-B-Q Pizza\n• Special Lamb Karhai\n\nWould you like details about any of these?",
          ...(pendingOrder && { pendingOrder }),
          ...(pendingReservation && { pendingReservation }),
          ...(pendingReservationRequest && { pendingReservationRequest })
        });
      }
    }

    // Detect payment info in user message and process order immediately
    if (pendingOrder && paymentMethodMatch && transactionIdMatch && !pendingReservation) {
      const paymentMethod = paymentMethodMatch[0].toLowerCase();
      const transactionId = transactionIdMatch[1];

      let itemName = pendingOrder.item || pendingOrder.matchedItem;
      let restaurantName = pendingOrder.restaurant || pendingOrder.restaurantName;
      let catName = pendingOrder.category || pendingOrder.matchedCategory;

      let found = fuzzyFind(restaurants, restaurantName) || fuzzyFind(restaurants, "Dawat Restaurant") || restaurants[0];
      let matchedCategory = catName ? fuzzyCategory(categories, catName) : null;
      let matchedItem = null;

      if (matchedCategory) {
        const catItems = items.filter(
          i => String(i.restaurantId) === String(found._id) && String(i.category) === String(matchedCategory._id)
        );
        if (itemName) {
          matchedItem = fuzzyFind(catItems, itemName);
        } else if (catItems.length > 0) {
          matchedItem = catItems[0];
        }
      } else {
        for (const cat of categories) {
          const catItems = items.filter(
            i => String(i.restaurantId) === String(found._id) && String(i.category) === String(cat._id)
          );
          if (itemName) {
            matchedItem = fuzzyFind(catItems, itemName);
            if (matchedItem) {
              matchedCategory = cat;
              break;
            }
          }
        }
      }

      if (matchedItem) {
        const orderPayload = {
          userId: userProfile?.email || "guest@demo.com",
          restaurantId: found._id,
          restaurantName: found.name,
          restaurantSlug: found.slug || found.name.toLowerCase().replace(/\s+/g, '-'),
          items: [{
            _id: matchedItem._id || matchedItem.id || matchedItem.name,
            name: matchedItem.name,
            price: matchedItem.price || 0,
            quantity: 1,
            specialInstructions: "",
            restaurantId: found._id,
            restaurantName: found.name,
            restaurantSlug: found.slug || found.name.toLowerCase().replace(/\s+/g, '-')
          }],
          totalPrice: matchedItem.price || 0,
          paymentMethod,
          transactionId
        };

        try {
          const orderRes = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderPayload)
          });
          const orderData = await orderRes.json();

          if (orderRes.ok && orderData.success) {
            return NextResponse.json({
              reply: `✅ Thank you for your payment! Your order for "${matchedItem.name}" at ${found.name} has been placed successfully. Your order number is ${orderData.order.orderNumber}. Would you like to add more items or need anything else?`,
              pendingOrder: null,
              // Maintain any existing pending states
              ...(pendingReservation && { pendingReservation }),
              ...(pendingReservationRequest && { pendingReservationRequest })
            });
          } else {
            return NextResponse.json({
              reply: `Sorry, I couldn't place your order due to an error: ${orderData.error || "Unknown error"}. Please try again.`,
              // Maintain any existing pending states
              ...(pendingReservation && { pendingReservation }),
              ...(pendingReservationRequest && { pendingReservationRequest })
            });
          }
        } catch (error) {
          return NextResponse.json({
            reply: `Sorry, I couldn't place your order due to a system error. Please try again.`,
            // Maintain any existing pending states
            ...(pendingReservation && { pendingReservation }),
            ...(pendingReservationRequest && { pendingReservationRequest })
          });
        }
      } else {
        return NextResponse.json({
          reply: `Sorry, I couldn't find "${itemName || 'the item you requested'}" on the menu at ${found.name}. Please specify the item name or choose from the menu.`,
          // Maintain any existing pending states
          ...(pendingReservation && { pendingReservation }),
          ...(pendingReservationRequest && { pendingReservationRequest })
        });
      }
    }

    // --- GEMINI AI PROCESSING FOR OTHER QUERIES ---
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Build context for Gemini
    const restaurantNames = Array.isArray(restaurants) ? restaurants.map(r => r.name).join(', ') : '';
    const menuText = Array.isArray(categories)
      ? categories.map(cat => {
        const catItems = Array.isArray(items)
          ? items.filter(i => String(i.category) === String(cat._id)).map(i => i.name).join(', ')
          : '';
        return `${cat.name}: ${catItems}`;
      }).join('\n')
      : '';

    const prompt = `
You are a smart restaurant assistant. Here are the available restaurants: ${restaurantNames}.
Menu: ${menuText}
For every user message, reply conversationally AND, if an action is needed (like reservation, order, menu, track order, explore category, suggest item, etc.), return a JSON object with a "reply" key and an "action" key (or null if no action).
If the user makes spelling mistakes, use fuzzy matching to guess their intent and correct names.
If the user greets, asks about restaurants, menu, categories, or anything general, answer conversationally.
If the user asks to see a category, include { "type": "explore-category", "category": "Rice" } etc.
If the user asks to order or suggests an item, include { "type": "order", "item": "Chicken Biryani", "category": "Rice", "restaurant": "Dawat Restaurant" }.
Example:
{
  "reply": "Your table is reserved!",
  "action": {
    "type": "reservation",
    "restaurant": "Dawat Restaurant",
    "date": "20-06-2026",
    "time": "20:00",
    "partySize": 3
  }
}
If no action is needed, set "action" to null.
User: ${message}
`;

    const geminiResult = await gemini.generateContent(prompt);
    let reply = geminiResult.text;
    let action = null;

    // Try to extract JSON from markdown code block if present
    let jsonMatch = geminiResult.text.match(/```json\s*([\s\S]*?)```/i);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed && typeof parsed === "object" && parsed.reply) {
          reply = parsed.reply;
          action = parsed.action || null;
        }
      } catch { }
    } else {
      try {
        const parsed = JSON.parse(geminiResult.text);
        if (parsed && typeof parsed === "object" && parsed.reply) {
          reply = parsed.reply;
          action = parsed.action || null;
        }
      } catch { }
    }

    // Fix: Reconstruct action from context if user is confirming
    const confirmWords = ["yes", "order now", "confirm", "place order", "go ahead", "sure", "okay", "ok", "proceed"];
    if (
      (!action || !action.type) &&
      confirmWords.some(word => (message || "").toLowerCase().includes(word)) &&
      (pendingOrder || lastSuggestion)
    ) {
      action = {
        type: "order",
        item: (pendingOrder && (pendingOrder.item || pendingOrder.matchedItem)) || lastSuggestion.item,
        category: (pendingOrder && (pendingOrder.category || pendingOrder.matchedCategory)) || lastSuggestion.category,
        restaurant: (pendingOrder && (pendingOrder.restaurant || pendingOrder.restaurantName)) || lastSuggestion.restaurant
      };
    }

    // Always return reply with any pending states
    const responseData = {
      reply,
      ...(action && { action }),
      ...(pendingOrder && { pendingOrder }),
      ...(pendingReservation && { pendingReservation }),
      ...(pendingReservationRequest && { pendingReservationRequest })
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error("Chatbot Error:", error);
    return NextResponse.json({
      error: "Internal server error",
      reply: "🔧 I'm experiencing some technical difficulties right now. Please try again in a moment, or contact our support team directly.\n\n📞 **Support:** [Your Phone Number]\n💬 **WhatsApp:** [Your WhatsApp]\n\nI apologize for the inconvenience!"
    }, { status: 500 });
  }
}