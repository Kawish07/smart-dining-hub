"use client";
import { SessionProvider } from "next-auth/react";

export default function CustomSessionProvider({ children, session }) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
