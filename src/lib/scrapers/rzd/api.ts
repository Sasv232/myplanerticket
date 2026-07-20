const RZD_BASE = "https://ticket.rzd.ru/api/v1";

async function rzdFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${RZD_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "Accept": "application/json",
      "Accept-Language": "ru-RU,ru;q=0.9",
      "Referer": "https://ticket.rzd.ru/",
      "Origin": "https://ticket.rzd.ru",
    },
  });

  if (!res.ok) {
    throw new Error(`RZD API ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export async function findStations(query: string): Promise<Array<{ name: string; code: string }>> {
  try {
    const data = await rzdFetch<{ stations?: Array<{ stationName: string; stationCode: string }> }>(
      "/autocomplete",
      { query, transportType: "rail" }
    );

    if (data.stations) {
      return data.stations.map((s) => ({
        name: s.stationName,
        code: s.stationCode,
      }));
    }
    return [];
  } catch {
    return findStationsLegacy(query);
  }
}

async function findStationsLegacy(query: string): Promise<Array<{ name: string; code: string }>> {
  try {
    const res = await fetch("https://pass.rzd.ru/timetable/public/ru?layer_id=5827", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      body: `stationNamePart=${encodeURIComponent(query)}&transportType=rail&groupResults=true`,
    });
    const data = await res.json();
    if (data?. stations) {
      return data.stations.map((s: { stationName: string; stationCode: string }) => ({
        name: s.stationName,
        code: s.stationCode,
      }));
    }
    return [];
  } catch {
    return [];
  }
}

export async function searchTrains(
  fromCode: string,
  toCode: string,
  date: string,
  passengers: number = 1
): Promise<unknown[]> {
  try {
    const data = await rzdFetch<{ trains?: unknown[] }>(
      "/train-routes",
      {
        origin: fromCode,
        destination: toCode,
        departureDate: `${date}T00:00:00`,
        adultPassengersQuantity: String(passengers),
        childrenPassengersQuantity: "0",
        service_provider: "B2B_RZD",
      }
    );
    return data.trains || [];
  } catch {
    return searchTrainsLegacy(fromCode, toCode, date, passengers);
  }
}

async function searchTrainsLegacy(
  fromCode: string,
  toCode: string,
  date: string,
  passengers: number
): Promise<unknown[]> {
  try {
    const dateFormatted = date.split("-").reverse().join(".");
    const initUrl = `https://pass.rzd.ru/timetable/public/ru?layer_id=5827&dir=0&tfl=3&checkSeats=1&code0=${fromCode}&code1=${toCode}&dt0=${dateFormatted}&md=1`;

    const session = await fetch(initUrl, {
      method: "POST",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const initData = await session.json();
    const rid = initData?.RID;
    if (!rid) return [];

    await new Promise((r) => setTimeout(r, 2000));

    const dataUrl = `https://pass.rzd.ru/timetable/public/ru?layer_id=5827`;
    const dataRes = await fetch(dataUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      body: `rid=${rid}`,
    });

    const data = await dataRes.json();
    return data?.trains || [];
  } catch {
    return [];
  }
}

export function parseTrains(rawTrains: unknown[], fromCode: string, toCode: string): Array<{
  trainNumber: string;
  trainName: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  cars: Array<{ type: string; className: string; available: number; price: number; currency: string }>;
}> {
  return rawTrains.map((t) => {
    const train = t as Record<string, unknown>;
    const seats = (train.seatCarCategories || train.seatCar || []) as Array<Record<string, unknown>>;
    const cars = seats.map((c: Record<string, unknown>) => ({
      type: String(c.carType || c.type || "unknown"),
      className: String(c.serviceClass || c.className || c.carType || "Неизвестно"),
      available: Number(c.freeSeats || c.available || 0),
      price: Number(c.minPrice || c.price || 0),
      currency: "RUB",
    }));

    return {
      trainNumber: String(train.trainNumber || train.number || ""),
      trainName: String(train.trainName || train.brand || ""),
      from: String(train.originStation || train.from || ""),
      to: String(train.destinationStation || train.to || ""),
      departureTime: String(train.departureTime || train.depTime || ""),
      arrivalTime: String(train.arrivalTime || train.arvTime || ""),
      duration: String(train.duration || ""),
      cars,
    };
  });
}
