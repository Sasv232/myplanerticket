import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://wttr.in/?format=3", {
      headers: { "User-Agent": "curl/7.64.1" },
    });
    const text = await res.text();
    const clean = text.trim();
    if (clean && !clean.includes("<!DOCTYPE")) {
      const match = clean.match(/^(\S+)\s+([\+\-]?\d+[°℃][\+\-]?\d*|[\+\-]?\d+[°℃]),?\s*(.*)$/);
      if (match) {
        return NextResponse.json({ temp: match[2], desc: match[3] || "", city: match[1] });
      }
      return NextResponse.json({ temp: clean, desc: "", city: "" });
    }
    return NextResponse.json({ temp: "", desc: "", city: "" });
  } catch {
    return NextResponse.json({ temp: "", desc: "", city: "" });
  }
}
