export interface Tracker {
  id: string;
  type: string;
  name: string;
  config: Record<string, unknown>;
  isActive: boolean;
  checkInterval: number;
  lastChecked: string | null;
  createdAt: string;
}

export interface CreateTrackerInput {
  type: string;
  name: string;
  config: Record<string, unknown>;
  isActive?: boolean;
  checkInterval?: number;
}

export interface UpdateTrackerInput extends Partial<CreateTrackerInput> {}

export interface ScrapeResult {
  id: string;
  trackerId: string;
  data: unknown;
  scrapedAt: string;
}

export interface PriceRecord {
  id: string;
  trackerId: string;
  price: number;
  currency: string;
  routeInfo: Record<string, unknown>;
  recordedAt: string;
}
