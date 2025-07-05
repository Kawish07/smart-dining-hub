// app/api/check-api-key/route.js
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { status: "error", message: "API key not found in environment variables" },
        { status: 400 }
      );
    }
    
    // Mask most of the key for security
    const maskedKey = apiKey.substring(0, 5) + "..." + apiKey.substring(apiKey.length - 5);
    
    // Test if the API key is valid by making a simple request
    try {
      const testResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`,
        { method: "GET" }
      );
      
      if (testResponse.ok) {
        const models = await testResponse.json();
        return NextResponse.json({
          status: "success",
          message: "API key is valid",
          maskedKey,
          availableModels: models.models ? models.models.map(m => m.name) : []
        });
      } else {
        const error = await testResponse.json();
        return NextResponse.json(
          { 
            status: "error", 
            message: "API key validation failed", 
            maskedKey,
            error 
          },
          { status: 400 }
        );
      }
    } catch (apiError) {
      return NextResponse.json(
        { 
          status: "error", 
          message: "Error testing API key", 
          maskedKey,
          error: apiError.message 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}