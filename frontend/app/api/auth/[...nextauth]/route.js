import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectToDb from "@/lib/mongodb";
import User from "@/models/User";

export const authOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" }
      },
      async authorize(credentials) {
        try {
          // Validate credentials
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email and password are required");
          }

          await connectToDb();

          // Find user
          const user = await User.findOne({ email: credentials.email });
          if (!user) {
            throw new Error("Invalid credentials");
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );
          if (!isPasswordValid) {
            throw new Error("Invalid credentials");
          }

          // Return user data
          return {
            id: user._id.toString(),
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
            email: user.email,
            role: user.role || 'user'
          };

        } catch (error) {
          console.error("Authorization error:", error.message);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/login",
    error: "/auth/error",
    newUser: "/auth/register"
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60 // 24 hours
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    encryption: false
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) ? url : baseUrl;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development"
};

// Initialize NextAuth and provide robust GET/POST handlers with fallbacks
let handler = null;
let initError = null;
try {
  handler = NextAuth(authOptions);
  console.log("[nextauth] route initialized");
} catch (err) {
  initError = err;
  console.error("[nextauth] initialization error:", err && err.stack ? err.stack : err);
}

export { authOptions };

// Resolve the actual GET/POST handlers that NextAuth provides
let GET_handler = null;
let POST_handler = null;
if (handler) {
  if (typeof handler === "function") {
    GET_handler = handler;
    POST_handler = handler;
  } else if (handler.handlers && typeof handler.handlers.GET === "function" && typeof handler.handlers.POST === "function") {
    GET_handler = handler.handlers.GET;
    POST_handler = handler.handlers.POST;
  } else if (typeof handler.GET === "function" && typeof handler.POST === "function") {
    GET_handler = handler.GET;
    POST_handler = handler.POST;
  }
}

export async function GET(req) {
  if (GET_handler) {
    try {
      return await GET_handler(req);
    } catch (err) {
      console.error("[nextauth] GET handler error:", err && err.stack ? err.stack : err);
      return new Response(JSON.stringify({ error: String(err && err.message ? err.message : err) }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  }

  console.error("[nextauth] GET fallback responding with init error");
  return new Response(
    JSON.stringify({
      error: String(initError && initError.message ? initError.message : initError),
      stack: initError && initError.stack ? initError.stack : null
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" }
    }
  );
}

export async function POST(req) {
  if (POST_handler) {
    try {
      return await POST_handler(req);
    } catch (err) {
      console.error("[nextauth] POST handler error:", err && err.stack ? err.stack : err);
      return new Response(JSON.stringify({ error: String(err && err.message ? err.message : err) }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  }

  console.error("[nextauth] POST fallback responding with init error");
  return new Response(
    JSON.stringify({
      error: String(initError && initError.message ? initError.message : initError),
      stack: initError && initError.stack ? initError.stack : null
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" }
    }
  );
}