import { BaseScraper, SearchParams, SearchResult, PriceAlert } from "../base";
import { registerScraper } from "../registry";
import { findStations, searchTrains, parseTrains } from "./api";
import { scrapeRzdSearch, scrapeRzdStations } from "./playwright";

class RzdScraper extends BaseScraper {
  readonly slug = "rzd";
  readonly name = "РЖД";
  readonly description = "Парсинг билетов поездов РЖД";

  async search(params: SearchParams): Promise<SearchResult[]> {
    const from = params.from as string;
    const to = params.to as string;
    const date = params.date as string;

    // Try Playwright first
    try {
      const playwrightResults = await scrapeRzdSearch(from, to, date);
      if (playwrightResults.length > 0) {
        return playwrightResults as unknown as SearchResult[];
      }
    } catch (e) {
      console.warn("Playwright failed, trying API:", e);
    }

    // Fallback to API
    try {
      const fromStations = await findStations(from);
      const toStations = await findStations(to);

      if (fromStations.length === 0 || toStations.length === 0) {
        return this.getMockData(from, to, date);
      }

      const rawTrains = await searchTrains(fromStations[0].code, toStations[0].code, date);
      if (!rawTrains || rawTrains.length === 0) {
        return this.getMockData(from, to, date);
      }

      return parseTrains(rawTrains, fromStations[0].code, toStations[0].code) as unknown as SearchResult[];
    } catch (e) {
      console.warn("API failed, using mock:", e);
      return this.getMockData(from, to, date);
    }
  }

  async findStationsCompat(query: string): Promise<Array<{ name: string; code: string }>> {
    // Try Playwright first
    try {
      const pwResults = await scrapeRzdStations(query);
      if (pwResults.length > 0) return pwResults;
    } catch {}

    // Fallback to API
    return findStations(query);
  }

  async checkPrice(
    trackerId: string,
    config: Record<string, unknown>
  ): Promise<PriceAlert[]> {
    const alerts: PriceAlert[] = [];
    const from = config.from as string;
    const to = config.to as string;
    const date = config.date as string;
    const maxPrice = config.maxPrice as number;

    const results = await this.search({ from, to, date });

    for (const train of results) {
      const cars = (train.cars || []) as Array<{ price: number; type: string }>;
      for (const car of cars) {
        if (maxPrice && car.price > 0 && car.price <= maxPrice) {
          alerts.push({
            trackerId,
            message: `Билет на поезд ${train.trainNumber} (${car.type}) за ${car.price}₽`,
            newPrice: car.price,
            direction: "down",
          });
        }
      }
    }

    return alerts;
  }

  private getMockData(from: string, to: string, date: string): SearchResult[] {
    return [
      {
        trainNumber: "001Э",
        trainName: "Ласточка",
        from,
        to,
        departureTime: "06:30",
        arrivalTime: "10:15",
        duration: "3ч 45м",
        cars: [
          { type: "seat", className: "Сидячий", price: 1500, available: 45, currency: "RUB" },
          { type: "compartment", className: "Купе", price: 3200, available: 12, currency: "RUB" },
        ],
      },
      {
        trainNumber: "053М",
        trainName: "Сапсан",
        from,
        to,
        departureTime: "07:00",
        arrivalTime: "10:30",
        duration: "3ч 30м",
        cars: [
          { type: "seat", className: "Эконом", price: 2100, available: 80, currency: "RUB" },
          { type: "seat", className: "Бизнес", price: 4500, available: 20, currency: "RUB" },
          { type: "compartment", className: "ВIP", price: 7000, available: 5, currency: "RUB" },
        ],
      },
    ];
  }
}

registerScraper(new RzdScraper());
