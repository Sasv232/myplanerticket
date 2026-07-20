import { NextRequest, NextResponse } from "next/server";
import { getScraper } from "@/lib/scrapers/registry";
import "@/lib/scrapers/init";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q");
    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const scraper = getScraper("rzd");
    if (!scraper || !("findStationsCompat" in scraper)) {
      return NextResponse.json([]);
    }

    const stations = await (scraper as any).findStationsCompat(query);
    return NextResponse.json(stations);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
