async function generateContent(prompt) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    // First, get the list of available models
    const modelsResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1/models?key=" + apiKey
    );
    
    if (!modelsResponse.ok) {
      throw new Error("Failed to retrieve models list");
    }
    
    const modelsData = await modelsResponse.json();
    
    // Find an appropriate model from the list that supports generateContent
    // Look for gemini models that support text generation
    const availableModels = modelsData.models || [];
    console.log("Available models:", availableModels.map(m => m.name));
    
    // Try to find the best available gemini model
    let modelName = "gemini-1.5-pro";  // Default to try first
    
    // Check if our preferred model exists in the list
    const modelExists = availableModels.some(m => 
      m.name.includes("gemini") && m.name.endsWith(modelName.split('/').pop())
    );
    
    if (!modelExists) {
      // If our preferred model doesn't exist, try to find any gemini model
      const geminiModel = availableModels.find(m => 
        m.name.includes("gemini") && m.supportedGenerationMethods.includes("generateContent")
      );
      
      if (geminiModel) {
        modelName = geminiModel.name.split('/').pop();
        console.log("Using alternative model:", modelName);
      } else {
        throw new Error("No suitable Gemini model found");
      }
    }
    
    // Direct API call using fetch with the appropriate model
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`,
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

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API request failed: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Gemini API direct call error:", error);
    throw new Error(`Gemini API direct call error: ${error.message}`);
  }
}

export default { generateContent };