import bcrypt from "bcryptjs";
import connectToDb from "@/lib/mongodb";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    await connectToDb();
    const body = await request.json();
    if (!body.email || !body.password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }
    const existing = await User.findOne({ email: body.email });
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }
    const hashedPassword = await bcrypt.hash(body.password, 10);
    const user = new User({
      ...body,
      password: hashedPassword,
      role: body.role || "user"
    });
    await user.save();
    return NextResponse.json({ success: true, user: { email: user.email, role: user.role } }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
