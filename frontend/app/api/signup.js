import { db } from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    
    const usersCollection = db.collection("users");
    const existingUser = await usersCollection.findOne({ email });

    if (existingUser) {
      return new Response(JSON.stringify({ message: "User already exists!" }), { status: 422 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await usersCollection.insertOne({ email, password: hashedPassword });

    return new Response(JSON.stringify({ message: "User created successfully!" }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Signup failed!" }), { status: 500 });
  }
}
