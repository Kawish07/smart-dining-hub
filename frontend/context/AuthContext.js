"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn, signOut, getSession } from "next-auth/react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log("Session Data:", session); // Debugging log
    console.log("Session Status:", status); // Debugging log

    if (status === "authenticated" && session?.user) {
      // Since you're using JWT strategy, you can use the session data directly
      // or get the JWT token from cookies if needed
      setUser({
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        // You can add a token property if needed for API calls
        token: "jwt-session-token", // Placeholder - see options below
      });
      
      console.log("✅ User authenticated:", session.user);
    } else if (status === "unauthenticated") {
      setUser(null);
    }
  }, [session, status]);

  const login = async (email, password) => {
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    console.log("Login Result:", result); // Debugging log

    if (result?.error) {
      alert(result.error);
    } else {
      router.push("/auth/dashboard");
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      await signOut();
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}