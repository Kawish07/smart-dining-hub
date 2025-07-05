import { connectDB } from "@/lib/mongodb";
import Staff from "@/models/Staff";
import bcrypt from "bcrypt";

export async function POST(req) {
  try {
    await connectDB();
    console.log("✅ Connected to MongoDB");

    // Parse incoming request data
    const { name, email, password } = await req.json();
    console.log("📩 Received Data:", { name, email });

    // Check if the staff email already exists
    const existingStaff = await Staff.findOne({ email });
    if (existingStaff) {
      console.log("❌ Staff email already exists:", email);
      return new Response(
        JSON.stringify({ message: "Staff email already exists." }),
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save the new staff member
    const newStaff = new Staff({ name, email, password: hashedPassword });
    await newStaff.save();
    console.log("✅ Staff registered:", newStaff);

    return new Response(
      JSON.stringify({ message: "Staff registered successfully!" }),
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Signup Error:", error);
    return new Response(
      JSON.stringify({ message: "Server error, please try again." }),
      { status: 500 }
    );
  }
}
