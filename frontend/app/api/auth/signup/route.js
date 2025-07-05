// app/api/auth/signup/route.js
import connectToDb from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import User from "@/models/User";

export async function POST(req) {
  try {
    const { firstName, lastName, email, password } = await req.json();

    // Validate required fields
    if (!email || !password) {
      return new Response(
        JSON.stringify({ message: "Email and password are required!" }), 
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ message: "Invalid email format!" }), 
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ message: "Password must be at least 8 characters long!" }), 
        { status: 400 }
      );
    }

    await connectToDb();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return new Response(
        JSON.stringify({ message: "User already exists with this email!" }), 
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const newUser = new User({
      firstName: firstName?.trim() || '',
      lastName: lastName?.trim() || '',
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'user', // Default role
    });

    await newUser.save();

    return new Response(
      JSON.stringify({ 
        message: "User created successfully!",
        user: {
          id: newUser._id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
        }
      }), 
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return new Response(
      JSON.stringify({ 
        message: "Signup failed!", 
        error: error.message 
      }), 
      { status: 500 }
    );
  }
}