import { NextResponse } from "next/server";

export const revalidate = 3600; // cache for 1 hour

export async function GET() {
  try {
    const res = await fetch("https://api.garmoth.com/api/grind-tracker/getGrindSpots", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`Garmoth API error: ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch grind spots" }, { status: 502 });
  }
}
