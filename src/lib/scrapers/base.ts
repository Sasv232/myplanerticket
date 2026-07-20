export interface SearchParams {
  [key: string]: string | number | boolean;
}

export interface SearchResult {
  [key: string]: unknown;
}

export interface PriceAlert {
  trackerId: string;
  message: string;
  oldPrice?: number;
  newPrice?: number;
  direction?: "down" | "up";
}

export abstract class BaseScraper {
  abstract readonly slug: string;
  abstract readonly name: string;
  abstract readonly description: string;

  abstract search(params: SearchParams): Promise<SearchResult[]>;
  abstract checkPrice(
    trackerId: string,
    config: Record<string, unknown>
  ): Promise<PriceAlert[]>;

  protected async fetchUrl(url: string, options?: RequestInit): Promise<string> {
    const res = await fetch(url, {
      ...options,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
        ...options?.headers,
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res.text();
  }
}
