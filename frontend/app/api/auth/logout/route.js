import { cookies } from "next/headers";

export async function POST(req) {
  try {
    // Clear authentication session token
    cookies().set("next-auth.session-token", "", { expires: new Date(0) });

    return new Response(JSON.stringify({ message: "Logged out successfully" }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Logout failed", error: error.message }), { status: 500 });
  }
}
