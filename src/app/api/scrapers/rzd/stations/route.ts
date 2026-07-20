import { NextRequest, NextResponse } from "next/server";
import { findStations } from "@/lib/scrapers/rzd/api";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q");
    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const stations = await findStations(query);
    return NextResponse.json(stations);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
