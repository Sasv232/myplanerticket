import { BaseScraper } from "./base";

const scrapers = new Map<string, BaseScraper>();

export function registerScraper(scraper: BaseScraper): void {
  scrapers.set(scraper.slug, scraper);
}

export function getScraper(slug: string): BaseScraper | undefined {
  return scrapers.get(slug);
}

export function getAllScrapers(): BaseScraper[] {
  return Array.from(scrapers.values());
}

export function getScraperSlugs(): string[] {
  return Array.from(scrapers.keys());
}
