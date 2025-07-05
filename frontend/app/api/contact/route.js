import dbConnect from "@/lib/mongodb";
import Contact from "@/models/Contact";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { name, email, message } = await req.json();

  // Validate the input
  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  try {
    // Connect to the database
    await dbConnect();

    // Create a new contact document
    const newContact = new Contact({ name, email, message });

    // Save the document to the database
    await newContact.save();

    // Return success response
    return NextResponse.json(
      { message: "Message sent successfully!" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving contact:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}