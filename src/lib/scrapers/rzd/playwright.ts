import chromium from "@sparticuz/chromium";
import type { Browser, Page } from "playwright-core";

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }

  const playwright = await import("playwright-core");
  browserInstance = await playwright.chromium.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  return browserInstance;
}

export async function scrapeRzdSearch(
  from: string,
  to: string,
  date: string
): Promise<Array<{
  trainNumber: string;
  trainName: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  cars: Array<{ type: string; className: string; price: number; available: number; currency: string }>;
}>> {
  let page: Page | null = null;

  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    await page.setExtraHTTPHeaders({
      "Accept-Language": "ru-RU,ru;q=0.9",
    });

    const dateFormatted = date.split("-").reverse().join(".");
    const url = `https://pass.rzd.ru/timetable/public/ru?layer_id=5827&dir=0&tfl=3&checkSeats=1&code0=${from}&code1=${to}&dt0=${dateFormatted}&md=1`;

    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(3000);

    const trains = await page.evaluate(() => {
      const results: Array<{
        trainNumber: string;
        trainName: string;
        departureTime: string;
        arrivalTime: string;
        duration: string;
        cars: Array<{ type: string; className: string; price: number; available: number; currency: string }>;
      }> = [];

      const trainEls = document.querySelectorAll(".train-list-item, .b-train, [data-train-number]");
      if (trainEls.length === 0) {
        const rows = document.querySelectorAll("table tr, .search-result-item");
        rows.forEach((row) => {
          const text = row.textContent || "";
          const match = text.match(/(\d{1,2}:\d{2})/g);
          if (match && match.length >= 2) {
            results.push({
              trainNumber: text.match(/(\d{1,3}[А-Яа-яA-Za-z]{1,3})/)?.[1] || "N/A",
              trainName: "",
              departureTime: match[0],
              arrivalTime: match[1],
              duration: text.match(/(\d+\s*ч\s*\d+\s*м|\d+:\d+)/)?.[1] || "",
              cars: [],
            });
          }
        });
        return results;
      }

      trainEls.forEach((el) => {
        const number = el.querySelector(".train-number, .b-train__num")?.textContent?.trim() || "";
        const name = el.querySelector(".train-name, .b-train__name")?.textContent?.trim() || "";
        const dep = el.querySelector(".departure-time, .b-train__dep-time")?.textContent?.trim() || "";
        const arr = el.querySelector(".arrival-time, .b-train__arr-time")?.textContent?.trim() || "";
        const dur = el.querySelector(".duration, .b-train__duration")?.textContent?.trim() || "";

        const cars: Array<{ type: string; className: string; price: number; available: number; currency: string }> = [];
        el.querySelectorAll(".car-type, .b-train__car").forEach((car) => {
          const type = car.querySelector(".car-type-name")?.textContent?.trim() || "";
          const priceText = car.querySelector(".price, .b-train__price")?.textContent?.trim() || "0";
          const price = parseInt(priceText.replace(/\D/g, ""), 10) || 0;
          const availText = car.querySelector(".available, .b-train__seats")?.textContent?.trim() || "0";
          const avail = parseInt(availText.replace(/\D/g, ""), 10) || 0;
          cars.push({ type, className: type, price, available: avail, currency: "RUB" });
        });

        results.push({
          trainNumber: number,
          trainName: name,
          departureTime: dep,
          arrivalTime: arr,
          duration: dur,
          cars,
        });
      });

      return results;
    });

    return trains;
  } catch (error) {
    console.error("Playwright RZD scrape error:", error);
    return [];
  } finally {
    if (page) await page.close().catch(() => {});
  }
}

export async function scrapeRzdStations(query: string): Promise<Array<{ name: string; code: string }>> {
  let page: Page | null = null;

  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    await page.goto("https://pass.rzd.ru/", { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(1000);

    const input = await page.$("input[name='from'], #from, .station-from input, input[placeholder*='Откуда']");
    if (!input) return [];

    await input.fill(query);
    await page.waitForTimeout(2000);

    const suggestions = await page.evaluate(() => {
      const items: Array<{ name: string; code: string }> = [];
      document.querySelectorAll(".ui-menu-item, .suggest-item, .autocomplete-suggestion").forEach((el) => {
        const name = el.textContent?.trim() || "";
        const code = el.getAttribute("data-code") || el.querySelector("[data-code]")?.getAttribute("data-code") || "";
        if (name && code) items.push({ name, code });
      });
      return items;
    });

    return suggestions;
  } catch (error) {
    console.error("Playwright RZD stations error:", error);
    return [];
  } finally {
    if (page) await page.close().catch(() => {});
  }
}

export async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close().catch(() => {});
    browserInstance = null;
  }
}
