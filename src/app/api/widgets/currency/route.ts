import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    const data = await res.json();
    if (data.rates) {
      return NextResponse.json({
        usd: data.rates.RUB,
        eur: data.rates.RUB / data.rates.EUR,
      });
    }
    return NextResponse.json({ usd: 0, eur: 0 });
  } catch {
    return NextResponse.json({ usd: 0, eur: 0 });
  }
}
