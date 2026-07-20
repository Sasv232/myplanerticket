import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const lat = request.nextUrl.searchParams.get("lat");
    const lon = request.nextUrl.searchParams.get("lon");

    let wttrUrl: string;
    if (lat && lon) {
      wttrUrl = `https://wttr.in/${lat},${lon}?format=%t|%C|%l&m`;
    } else {
      wttrUrl = `https://wttr.in/?format=%t|%C|%l&m`;
    }

    const res = await fetch(wttrUrl, {
      headers: { "User-Agent": "curl/7.64.1" },
    });
    const text = await res.text();
    const clean = text.trim();

    if (!clean || clean.includes("<!DOCTYPE")) {
      return NextResponse.json({ temp: "", desc: "", city: "" });
    }

    const parts = clean.split("|");
    return NextResponse.json({
      temp: parts[0]?.trim() || "",
      desc: parts[1]?.trim() || "",
      city: parts[2]?.trim() || "",
    });
  } catch {
    return NextResponse.json({ temp: "", desc: "", city: "" });
  }
}
