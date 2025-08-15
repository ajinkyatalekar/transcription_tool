"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "../context/AuthContext";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (!user) {
      redirect("/");
    }
  }, [user]);

  return (
    <Button onClick={() => signOut()}>Sign Out</Button>
  );
}