"use client";
import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Bot, User, Image } from "lucide-react";
import { useSession } from "next-auth/react";

const Chatbot = () => {
  const { data: session } = useSession();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastSuggestion, setLastSuggestion] = useState(null);
  const [lastSuggestedCategory, setLastSuggestedCategory] = useState(null);
  const [lastSuggestionIndex, setLastSuggestionIndex] = useState(0);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [pendingPayment, setPendingPayment] = useState(null);
  const [pendingReservationRequest, setPendingReservationRequest] = useState(null);
  const [pendingReservation, setPendingReservation] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const chatWelcomeMessage = {
    text: "Hello! I'm your personal dining assistant. Ask me anything about restaurants, menus, reservations, or orders.",
    sender: "bot"
  };

 const quickReplies = [
  "Show menus",
  "Show categories", 
  "Show popular dishes",
  "Reserve table",
  "Track my order"
];

  useEffect(() => {
    if (messages.length === 0 && isOpen) {
      setTimeout(() => {
        setMessages([chatWelcomeMessage]);
      }, 500);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 300);
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    if (!isOpen && messages.length > 0 && messages[messages.length - 1].sender === "bot") {
      setUnreadCount(prev => prev + 1);
    }
  }, [messages, isOpen]);

  const formatMessageText = (text) => {
    if (!text) return null;
    const messageText = typeof text === 'string' ? text : String(text);
    return messageText.split('\n').map((line, i, arr) => (
      <span key={i}>
        {line}
        {i < arr.length - 1 && <br />}
      </span>
    ));
  };

  const handleOpenChat = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setUnreadCount(0);
  };

  const handleSendMessage = async () => {
  if (!input.trim()) return;

  // --- Reservation intent: clear pendingOrder and pendingPayment ---
  if (/reserve( another)?( table)?/i.test(input)) {
    setPendingOrder(null);
    setPendingPayment(null);
  }

  // --- Robust Payment detection for BOTH orders and reservations ---
  const paymentMethodMatch = input.match(/easypaisa|jazzcash|nayapay|sadapay|allied|cash/i);
  const transactionIdMatch = input.match(/(?:transaction\s*id\s*[:\-]?\s*)?(\d{6,}|cash\s*on\s*delivery)/i);

  // Handle ORDER payment completion
  if (pendingOrder && paymentMethodMatch && transactionIdMatch && !pendingReservation) {
    const paymentMethod = paymentMethodMatch[0].toLowerCase();
    const transactionId = transactionIdMatch[1];

    setIsTyping(true);

    try {
      const paymentResponse = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          userProfile: session?.user ? {
            email: session.user.email,
            id: session.user.id,
            name: session.user.name
          } : undefined,
          pendingOrder,
          pendingPayment: {
            paymentMethod,
            transactionId
          }
        }),
      });

      let paymentData = { reply: "Sorry, I couldn't understand the response from the server." };
      
      if (paymentResponse.ok) {
        try {
          paymentData = await paymentResponse.json();
        } catch (jsonErr) {
          console.error("❌ Failed to parse payment JSON:", jsonErr);
        }
      } else {
        console.error("❌ Payment response not OK:", paymentResponse.status);
      }

      setMessages((prev) => [
        ...prev,
        { text: input, sender: "user" },
        {
          text: paymentData.reply || "Sorry, I didn't understand that. Please try rephrasing your question.",
          sender: "bot"
        }
      ]);
      
      if (paymentData.reply && /order (for|number|placed|successfully|confirmed|has been placed)/i.test(paymentData.reply)) {
        setPendingOrder(null);
        setPendingPayment(null);
      }
    } catch (error) {
      console.error("❌ Payment processing error:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "Sorry, something went wrong with the payment. Please try again.",
          sender: "bot",
          isError: true
        }
      ]);
    } finally {
      setInput("");
      setIsTyping(false);
    }
    return;
  }

  // Handle RESERVATION payment completion
  if (pendingReservation?.step === 'payment' && paymentMethodMatch && transactionIdMatch) {
    const paymentMethod = paymentMethodMatch[0].toLowerCase();
    const transactionId = transactionIdMatch[1];

    setIsTyping(true);

    try {
      const reservationResponse = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          userProfile: session?.user ? {
            email: session.user.email,
            id: session.user.id,
            name: session.user.name
          } : undefined,
          pendingReservation
        }),
      });

      let reservationData = { reply: "Sorry, I couldn't understand the response from the server." };
      
      if (reservationResponse.ok) {
        try {
          reservationData = await reservationResponse.json();
        } catch (jsonErr) {
          console.error("❌ Failed to parse reservation JSON:", jsonErr);
        }
      } else {
        console.error("❌ Reservation response not OK:", reservationResponse.status);
      }

      setMessages((prev) => [
        ...prev,
        { text: input, sender: "user" },
        {
          text: reservationData.reply || "Sorry, I didn't understand that. Please try rephrasing your question.",
          sender: "bot"
        }
      ]);

      // Clear reservation state on successful confirmation
      if (reservationData.reply && /reservation confirmed/i.test(reservationData.reply)) {
        setPendingReservation(null);
      } else if (reservationData.pendingReservation) {
        setPendingReservation(reservationData.pendingReservation);
      }
    } catch (error) {
      console.error("❌ Reservation processing error:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "Sorry, something went wrong with the reservation. Please try again.",
          sender: "bot",
          isError: true
        }
      ]);
    } finally {
      setInput("");
      setIsTyping(false);
    }
    return;
  }

  // --- Normal message flow ---
  const userMessage = {
    text: input,
    sender: "user"
  };
  setMessages((prev) => [...prev, userMessage]);
  setInput("");

  try {
    setIsTyping(true);

    const response = await fetch("/api/chatbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: input,
        userProfile: session?.user ? {
          email: session.user.email,
          id: session.user.id,
          name: session.user.name
        } : undefined,
        suggestTime: /suggest(ed)? time|what time.*free|when.*available|show.*available.*time|suggest.*table/i.test(input),
        pendingReservationRequest,
        pendingReservation,
        lastSuggestion: lastSuggestion || undefined,
        pendingOrder,
        pendingPayment
      }),
    });

    let data = { reply: "Sorry, I couldn't understand the response from the server." };
    
    if (response.ok) {
      try {
        data = await response.json();
      } catch (jsonErr) {
        console.error("❌ Failed to parse JSON:", jsonErr);
      }
    } else {
      console.error("❌ Response not OK:", response.status);
    }

    // Handle reservation state updates
    if (data.pendingReservation !== undefined) {
      setPendingReservation(data.pendingReservation);
    }

    if (data.pendingReservationRequest !== undefined) {
      setPendingReservationRequest(data.pendingReservationRequest);
    }

    let newLastSuggestion = lastSuggestion;

    if (typeof data.reply === "string") {
      const match = data.reply.match(/suggestion in (.+?) at (.+?) is: ([^\n]+)/i);
      if (match) {
        newLastSuggestion = {
          category: match[1].trim(),
          restaurant: match[2].trim(),
          item: match[3].split('(')[0].trim()
        };
      }

      const multiMatch = data.reply.match(/- ([^\n]+)/);
      if (!newLastSuggestion && multiMatch) {
        newLastSuggestion = {
          item: multiMatch[1].split('(')[0].trim()
        };
      }
    }

    setLastSuggestion(newLastSuggestion);

    setMessages((prev) => [
      ...prev,
      {
        text: data.reply || "Sorry, I didn't understand that. Please try rephrasing your question.",
        sender: "bot"
      }
    ]);

    if (data.pendingOrder) {
      setPendingOrder(data.pendingOrder);
    }

  } catch (error) {
    console.error("❌ Chatbot error:", error);
    setMessages((prev) => [
      ...prev,
      {
        text: "Sorry, something went wrong. Please try again.",
        sender: "bot",
        isError: true
      }
    ]);
  } finally {
    setIsTyping(false);
  }
};

  return (
    <>
      <div
        className="fixed bottom-6 right-6 flex flex-col items-end space-y-4 z-50"
        onClick={e => e.stopPropagation()}
      >
        {isOpen && (
          <div
            className={`w-96 bg-white rounded-3xl overflow-hidden shadow-xl transition-all duration-500 transform ${isMinimized ? 'h-16' : 'h-[520px]'
              } flex flex-col border border-emerald-100`}
            style={{
              boxShadow: "0 20px 40px rgba(16, 185, 129, 0.15), 0 0 0 1px rgba(16, 185, 129, 0.05)",
            }}
          >
            <div
              className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white flex justify-between items-center cursor-pointer relative overflow-hidden"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="flex items-center z-10">
                <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl mr-3 border border-white/30">
                  <Bot size={22} className="text-white" />
                </div>
                <div className="mt-12">
                  <h2 className="font-semibold text-lg">Dining Concierge</h2>
                  {!isMinimized && (
                    <span className="text-xs text-emerald-100">Online • Ready to assist</span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMinimized(!isMinimized);
                  }}
                  className="p-2 rounded-xl hover:bg-white/20 transition-all duration-200 backdrop-blur-sm"
                >
                  {isMinimized ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  className="p-2 rounded-xl hover:bg-white/20 transition-all duration-200 backdrop-blur-sm"
                >
                  <X className="text-white" size={18} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                <div className="flex-1 p-5 overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                        <MessageCircle className="text-emerald-600" size={32} />
                      </div>
                      <h3 className="font-semibold text-gray-800 mb-2 text-lg">Welcome to Dining Concierge</h3>
                      <p className="text-sm text-gray-600 max-w-xs leading-relaxed">
                        Ask me anything about our restaurants, menus, or make a reservation. I'm here to help!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg, index) => (
                        <div
                          key={index}
                          className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"
                            }`}
                        >
                          {msg.sender === "bot" && (
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 mr-3 shadow-sm">
                              <Bot size={18} className="text-white" />
                            </div>
                          )}
                          <div
                            className={`p-4 rounded-2xl max-w-[80%] shadow-sm ${msg.sender === "user"
                              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-tr-md shadow-emerald-200"
                              : "bg-white border border-gray-100 text-gray-800 rounded-tl-md shadow-gray-100"
                              } ${msg.isError ? "border-red-200 bg-red-50 text-red-800" : ""}`}
                            style={{
                              boxShadow: msg.sender === "user" 
                                ? "0 4px 12px rgba(16, 185, 129, 0.2)" 
                                : "0 2px 8px rgba(0, 0, 0, 0.05)"
                            }}
                          >
                            <div className="text-sm leading-relaxed">
                              {formatMessageText(msg.text)}
                            </div>
                          </div>
                          {msg.sender === "user" && (
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center flex-shrink-0 ml-3 shadow-sm">
                              <User size={18} className="text-gray-600" />
                            </div>
                          )}
                        </div>
                      ))}

                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 mr-3 shadow-sm">
                            <Bot size={18} className="text-white" />
                          </div>
                          <div className="p-4 rounded-2xl bg-white border border-gray-100 rounded-tl-md shadow-sm">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-100"></div>
                              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-200"></div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {messages.length > 0 && !isTyping && (
                  <div className="px-5 py-3 bg-white border-t border-gray-100">
                    <div className="flex overflow-x-auto pb-2 hide-scrollbar space-x-2">
                      {quickReplies.map((reply, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setInput(reply);
                            setTimeout(() => handleSendMessage(), 100);
                          }}
                          className="flex-shrink-0 px-4 py-2 text-sm rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200 hover:from-emerald-100 hover:to-teal-100 hover:border-emerald-300 transition-all duration-200 whitespace-nowrap font-medium shadow-sm"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-4 bg-white border-t border-gray-100 ">
                  <div className="flex items-center bg-gray-50 rounded-2xl px-4 py-2 border border-gray-200 focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-100 transition-all duration-200">
                    <button className="p-2 text-gray-400 hover:text-emerald-600 rounded-xl transition-colors">
                      <Image size={18} />
                    </button>
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder="Type your question or track order ID..."
                      className="w-full p-2 bg-transparent outline-none text-gray-700 placeholder-gray-400 text-sm"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!input.trim()}
                      className={`p-2.5 rounded-xl transition-all duration-200 ${input.trim()
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm hover:shadow-md hover:from-emerald-600 hover:to-teal-600'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <button
          onClick={handleOpenChat}
          className="group relative h-16 w-16 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center overflow-hidden"
          style={{
            boxShadow: "0 8px 24px rgba(16, 185, 129, 0.3), 0 0 0 1px rgba(16, 185, 129, 0.1)"
          }}
        >
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center border-2 border-white shadow-sm font-semibold">
              {unreadCount}
            </span>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <MessageCircle className="text-white relative z-10 group-hover:scale-110 transition-transform duration-300" size={28} />
        </button>
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
};

export default Chatbot;