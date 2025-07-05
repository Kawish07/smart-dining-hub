// lib/gemini-debug.js

async function generateContent(prompt) {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not defined in environment variables");
      throw new Error("API key not configured");
    }
    
    console.log("Using API key:", apiKey.substring(0, 5) + "..." + apiKey.substring(apiKey.length - 5));
    
    try {
      // Log the actual request we're making
      console.log("Making request to Gemini API...");
      
      // Make direct API call with detailed error information
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000,
            },
          }),
        }
      );
      
      console.log("Response status:", response.status);
      
      // Get response data
      const responseText = await response.text();
      console.log("Raw response:", responseText.substring(0, 200) + "...");
      
      // Parse if it's JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Error parsing response as JSON:", parseError);
        throw new Error(`API returned non-JSON response: ${responseText.substring(0, 100)}`);
      }
      
      // Check for API errors
      if (!response.ok) {
        console.error("API error response:", data);
        throw new Error(`API request failed with status ${response.status}: ${JSON.stringify(data)}`);
      }
      
      // Check for expected response structure
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        console.error("Unexpected response structure:", data);
        throw new Error("API response missing expected structure");
      }
      
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error("Detailed Gemini API error:", error);
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }
  
  export default { generateContent };