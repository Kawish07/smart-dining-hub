import fetch from 'node-fetch';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Use the latest stable Gemini 1.5 Pro model
const GEMINI_MODELS = [
  "models/gemini-1.5-pro-002"
];

const gemini = {
  async generateContent(query) {
    let lastError = null;
    for (const model of GEMINI_MODELS) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: query }] }]
            })
          }
        );
        const data = await response.json();
        if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          const text = data.candidates[0].content.parts[0].text;
          return { text, raw: data };
        }
        lastError = data?.error || data;
      } catch (err) {
        lastError = err;
      }
    }
    return { text: "Sorry, I couldn't connect to Gemini API.", raw: lastError };
  }
};

export default gemini;