import { NextResponse } from "next/server";

export async function POST() {
  // 3-second pause then hangup — just enough to detect if a human answers
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Pause length="3"/>
  <Hangup/>
</Response>`;

  return new Response(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}
