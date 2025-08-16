import { useState } from "react";

export default function Transcribe() {
  const [transcript, setTranscript] = useState("");

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    const arrayBuffer = await file.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");
    
    const res = await fetch("/api/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audioBase64: base64Audio }),
    });

    const data = await res.json();
    setTranscript(JSON.stringify(data, null, 2));
  };

  return (
    <div>
      <input type="file" accept="audio/*" onChange={handleFileUpload} />
      <pre>Transcript: {transcript}</pre>
    </div>
  );
}
