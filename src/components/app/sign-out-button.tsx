"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export async function signOut() {
  await authClient.signOut();
  // Full reload clears any private data kept in the client router cache.
  window.location.replace(new URL("/login", window.location.origin).href);
}

export function SignOutButton() {
  return (
    <Button variant="outline" onClick={signOut}>
      <LogOut /> Sign out
    </Button>
  );
}
