import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://zenquotes.io/api/today");
    const data = await res.json();
    if (data[0]) {
      return NextResponse.json({
        text: data[0].q,
        author: data[0].a,
      });
    }
    return NextResponse.json({ text: "", author: "" });
  } catch {
    return NextResponse.json({ text: "", author: "" });
  }
}
