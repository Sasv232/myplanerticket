export interface RzdSearchParams {
  from: string;
  to: string;
  date: string;
  passengers?: number;
}

export interface RzdStation {
  name: string;
  code: string;
  stationType?: string;
}

export interface RzdTrain {
  trainNumber: string;
  trainName: string;
  from: string;
  to: string;
  fromCode: string;
  toCode: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  trainCategory?: string;
  cars: RzdCar[];
}

export interface RzdCar {
  type: string;
  className: string;
  available: number;
  price: number;
  currency: string;
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
