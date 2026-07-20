import { NextRequest, NextResponse } from "next/server";
import { searchRzd } from "@/lib/scrapers/rzd/search";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { from, to, date } = body;

    if (!from || !to || !date) {
      return NextResponse.json(
        { error: "Поля 'from', 'to' и 'date' обязательны" },
        { status: 400 }
      );
    }

    const result = await searchRzd({ from, to, date });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
