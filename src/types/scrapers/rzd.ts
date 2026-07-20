export interface RzdSearchParams {
  from: string;
  to: string;
  date: string;
  passengers?: number;
}

export interface RzdTrain {
  trainNumber: string;
  trainName: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  cars: RzdCar[];
}

export interface RzdCar {
  type: string;
  className: string;
  available: number;
  price: number;
  currency: string;
  upper: number;
  lower: number;
  side: number;
}

export interface RzdSearchResult {
  trains: RzdTrain[];
  searchParams: RzdSearchParams;
  scrapedAt: string;
}

export interface RzdPriceAlert {
  trainNumber: string;
  carType: string;
  oldPrice: number;
  newPrice: number;
  direction: "down" | "up";
  message: string;
}
