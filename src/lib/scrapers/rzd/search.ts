import { RzdSearchParams, RzdTrain, RzdSearchResult } from "@/types/scrapers/rzd";
import { getScraper } from "../registry";
import "../init";

export async function searchRzd(params: RzdSearchParams): Promise<RzdSearchResult> {
  const scraper = getScraper("rzd");
  if (!scraper) throw new Error("RZD scraper not found");

  const results = await scraper.search({
    from: params.from,
    to: params.to,
    date: params.date,
  });

  return {
    trains: results as unknown as RzdTrain[],
    searchParams: params,
    scrapedAt: new Date().toISOString(),
  };
}

export async function checkRzdPrices(
  trackerId: string,
  config: Record<string, unknown>
) {
  const scraper = getScraper("rzd");
  if (!scraper) throw new Error("RZD scraper not found");
  return scraper.checkPrice(trackerId, config);
}
