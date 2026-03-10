import { NextResponse } from "next/server";

export const revalidate = 1800; // cache for 30 min

export async function GET() {
  try {
    const res = await fetch("https://api.garmoth.com/api/news", {
      next: { revalidate: 1800 },
    });
    if (!res.ok) throw new Error(`Garmoth API error: ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 502 });
  }
}
