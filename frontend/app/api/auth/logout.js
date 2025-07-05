import { getSession } from "next-auth/react";
import { cookies } from "next/headers";

export async function POST(req, res) {
  try {
    // Get current session
    const session = await getSession({ req });

    if (!session) {
      return new Response(JSON.stringify({ message: "No active session" }), { status: 401 });
    }

    // Clear session cookie
    cookies().set("next-auth.session-token", "", { expires: new Date(0) });

    return new Response(JSON.stringify({ message: "Logged out successfully" }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Logout failed", error: error.message }), { status: 500 });
  }
}
