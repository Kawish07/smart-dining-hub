import { db } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    const usersCollection = db.collection("users");
    const user = await usersCollection.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return new Response(JSON.stringify({ message: "Invalid credentials!" }), { status: 401 });
    }

    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

    return new Response(JSON.stringify({ message: "Login successful!", token }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Login failed!" }), { status: 500 });
  }
}

export default function handler(req, res) {
    if (req.method === "POST") {
        res.status(200).json({ message: "Login successful" });
    } else {
        res.status(405).json({ message: "Method Not Allowed" });
    }
}
