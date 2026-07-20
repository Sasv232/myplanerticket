import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const lat = request.nextUrl.searchParams.get("lat");
    const lon = request.nextUrl.searchParams.get("lon");

    let url: URL;
    if (lat && lon) {
      url = new URL("https://wttr.in/");
      url.searchParams.set("format", "%t|%C|%l");
      url.searchParams.set("lat", lat);
      url.searchParams.set("lon", lon);
    } else {
      url = new URL("https://wttr.in/");
      url.searchParams.set("format", "%t|%C|%l");
    }

    const res = await fetch(url.toString(), {
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
