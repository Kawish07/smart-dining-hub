import connectToDb from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "@/models/User";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    await connectToDb();

    const user = await User.findOne({ email });
    if (!user) {
      return new Response(JSON.stringify({ message: "Invalid credentials!" }), { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return new Response(JSON.stringify({ message: "Invalid credentials!" }), { status: 401 });
    }

    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    return new Response(JSON.stringify({ message: "Login successful!", token }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Login failed!", error: error.message }), { status: 500 });
  }
}
