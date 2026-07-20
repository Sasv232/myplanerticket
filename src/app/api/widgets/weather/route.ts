import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://wttr.in/?format=%t|%C|%l&lang=ru", {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const text = await res.text();
    const [temp, desc, city] = text.split("|");
    return NextResponse.json({
      temp: temp?.trim() || "",
      desc: desc?.trim() || "",
      city: city?.trim() || "",
    });
  } catch {
    return NextResponse.json({ temp: "", desc: "", city: "" });
  }
}
