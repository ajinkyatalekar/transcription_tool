import { Button } from "@/components/ui/button";
import { MoveRight } from "lucide-react";
import Image from "next/image";

export default function Home() {
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
          Automatically transcribe audio to text with powerful transcription models. Get Started Now! <br/>
          Supports Whisper, Wave2Vec, Jesper, and Parakeet.
        </p>

        <div className="flex flex-row gap-2">
          <Button>Register</Button>
          <Button variant="outline">Login</Button>
        </div>
      </main>
    </div>
  );
}
