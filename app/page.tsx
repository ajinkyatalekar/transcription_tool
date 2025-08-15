"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "./context/AuthContext";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      redirect("/home");
    }
  }, [user]);

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-4 row-start-2 items-center sm:items-start">
        <div className="flex flex-col items-start">
          <Image
            src="soundwave.svg"
            alt="wave"
            width={80}
            height={80}
            className="-mb-2"
          />
          <p className="text-5xl">Transcription Tool.</p>
        </div>

        <p className="text-lg">
          Automatically transcribe audio to text with powerful transcription
          models. Get Started Now! <br />
          Supports Whisper, Wave2Vec, Jesper, and Parakeet.
        </p>

        <div className="flex flex-row gap-2">
          <Button asChild>
            <Link href="/auth?mode=register">Register</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/auth?mode=login">Login</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
