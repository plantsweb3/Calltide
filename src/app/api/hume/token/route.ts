import { NextResponse } from "next/server";
import { fetchAccessToken } from "hume";

export async function GET() {
  const accessToken = await fetchAccessToken({
    apiKey: String(process.env.HUME_API_KEY),
    secretKey: String(process.env.HUME_SECRET_KEY),
  });

  if (!accessToken) {
    return NextResponse.json({ error: "Failed to get access token" }, { status: 500 });
  }

  return NextResponse.json({ accessToken });
}
