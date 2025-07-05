// Create this as /api/debug-gemini/route.js for testing

import { NextResponse } from "next/server";
import gemini from "@/lib/gemini";
import geminiFallback from "@/lib/gemini-fallback";

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    tests: []
  };

  // Test 1: API Key availability
  diagnostics.tests.push({
    test: "API Key Check",
    status: process.env.GEMINI_API_KEY ? "✅ Present" : "❌ Missing",
    details: process.env.GEMINI_API_KEY ? "API key is set" : "GEMINI_API_KEY environment variable not found"
  });

  // Test 2: Primary Gemini instance
  try {
    const result = await gemini.generateContent("Say 'Primary connection working'");
    diagnostics.tests.push({
      test: "Primary Gemini",
      status: "✅ Working",
      response: result.response ? result.response.text() : result
    });
  } catch (error) {
    diagnostics.tests.push({
      test: "Primary Gemini",
      status: "❌ Failed",
      error: error.message,
      code: error.code || 'Unknown'
    });
  }

  // Test 3: Fallback Gemini instance
  try {
    const result = await geminiFallback.generateContent("Say 'Fallback connection working'");
    diagnostics.tests.push({
      test: "Fallback Gemini",
      status: "✅ Working",
      response: result.response ? result.response.text() : result
    });
  } catch (error) {
    diagnostics.tests.push({
      test: "Fallback Gemini",
      status: "❌ Failed", 
      error: error.message,
      code: error.code || 'Unknown'
    });
  }

  return NextResponse.json(diagnostics);
}