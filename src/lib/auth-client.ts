"use client";
import { createAuthClient } from "better-auth/react";

// Same-origin: baseURL defaults to the current origin; basePath matches the
// server mount at /api/auth.
export const authClient = createAuthClient({
  basePath: "/api/auth",
});

export const { useSession, signIn, signOut, signUp } = authClient;
