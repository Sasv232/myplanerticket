import {
  addDays,
  addWeeks,
  addMonths,
  nextMonday as fnNextMonday,
  format,
  parse,
  isValid,
  startOfDay,
} from "date-fns";
import { ru } from "date-fns/locale";

export interface ParsedTask {
  title: string;
  dueDate: string | null;
  dueTime: string | null;
  priority: string | null;
  label: string | null;
  repeatRule: string | null;
}

const RUSSIAN_DAYS: Record<string, number> = {
  понедельник: 1,
  вторник: 2,
  среда: 3,
  четверг: 4,
  пятница: 5,
  суббота: 6,
  воскресенье: 0,
};

const ENGLISH_DAYS: Record<string, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 0,
};

const MONTHS_RU: Record<string, number> = {
  января: 0,
  февраля: 1,
  марта: 2,
  апреля: 3,
  мая: 4,
  июня: 5,
  июля: 6,
  августа: 7,
  сентября: 8,
  октября: 9,
  ноября: 10,
  декабря: 11,
};

const MONTHS_EN: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

function getToday(): Date {
  return startOfDay(new Date());
}

function formatDateISO(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function nextWeekday(target: number): Date {
  const today = getToday();
  const current = today.getDay();
  let diff = target - current;
  if (diff <= 0) diff += 7;
  return addDays(today, diff);
}

function nextMonday(): Date {
  return fnNextMonday(getToday());
}

export function parseTaskInput(text: string): ParsedTask {
  let remaining = text.trim();
  let dueDate: string | null = null;
  let dueTime: string | null = null;
  let priority: string | null = null;
  let label: string | null = null;
  let repeatRule: string | null = null;

  // ── Priority ──
  const priorityPatterns: [RegExp, string][] = [
    [/!urgent\s*/i, "urgent"],
    [/!high\s*/i, "high"],
    [/!medium\s*/i, "medium"],
    [/!low\s*/i, "low"],
    [/\bсрочно\b\s*/i, "urgent"],
    [/\bважно\b\s*/i, "high"],
  ];
  for (const [re, p] of priorityPatterns) {
    if (re.test(remaining)) {
      priority = p;
      remaining = remaining.replace(re, "");
    }
  }

  // ── Label ──
  const labelMatch = remaining.match(/@(\w+)\s*/);
  if (labelMatch) {
    label = labelMatch[1].toLowerCase();
    remaining = remaining.replace(/@\w+\s*/, "");
  }

  // ── Repeat rule ──
  const repeatPatterns: [RegExp, string][] = [
    [/каждый\s+день\s*/i, "daily"],
    [/каждую\s+неделю\s*/i, "weekly"],
    [/каждый\s+месяц\s*/i, "monthly"],
    [/по\s+будням\s*/i, "weekdays"],
    [/\bdaily\b\s*/i, "daily"],
    [/\bweekly\b\s*/i, "weekly"],
    [/\bmonthly\b\s*/i, "monthly"],
    [/\bweekdays\b\s*/i, "weekdays"],
  ];
  for (const [re, r] of repeatPatterns) {
    if (re.test(remaining)) {
      repeatRule = r;
      remaining = remaining.replace(re, "");
    }
  }

  // ── Date: relative ("через N дней/дня/день", "in N days") ──
  const ruRelativeMatch = remaining.match(
    /через\s+(\d+)\s+(день|дня|дней|недел[яьи]|месяц[аев]*)\s*/i
  );
  if (ruRelativeMatch) {
    const n = parseInt(ruRelativeMatch[1], 10);
    const unit = ruRelativeMatch[2].toLowerCase();
    let d = getToday();
    if (unit.startsWith("день")) d = addDays(d, n);
    else if (unit.startsWith("недел")) d = addWeeks(d, n);
    else if (unit.startsWith("месяц")) d = addMonths(d, n);
    dueDate = formatDateISO(d);
    remaining = remaining.replace(/через\s+\d+\s+\S+\s*/, "");
  }

  const enRelativeMatch = remaining.match(
    /in\s+(\d+)\s+(day|days|week|weeks|month|months)\s*/i
  );
  if (enRelativeMatch && !dueDate) {
    const n = parseInt(enRelativeMatch[1], 10);
    const unit = enRelativeMatch[2].toLowerCase();
    let d = getToday();
    if (unit.startsWith("day")) d = addDays(d, n);
    else if (unit.startsWith("week")) d = addWeeks(d, n);
    else if (unit.startsWith("month")) d = addMonths(d, n);
    dueDate = formatDateISO(d);
    remaining = remaining.replace(/in\s+\d+\s+\S+\s*/i, "");
  }

  // ── Date: "завтра", "послезавтра", "tomorrow", "today" ──
  if (!dueDate) {
    const namedDatePatterns: [RegExp, Date][] = [
      [/\bзавтра\b\s*/i, addDays(getToday(), 1)],
      [/\bпослезавтра\b\s*/i, addDays(getToday(), 2)],
      [/\btomorrow\b\s*/i, addDays(getToday(), 1)],
      [/\btoday\b\s*/i, getToday()],
    ];
    for (const [re, d] of namedDatePatterns) {
      if (re.test(remaining)) {
        dueDate = formatDateISO(d);
        remaining = remaining.replace(re, "");
        break;
      }
    }
  }

  // ── Date: day name ("понедельник", "next monday") ──
  if (!dueDate) {
    for (const [name, dayNum] of Object.entries(RUSSIAN_DAYS)) {
      const re = new RegExp(`\\b${name}\\b\\s*`, "i");
      if (re.test(remaining)) {
        dueDate = formatDateISO(nextWeekday(dayNum));
        remaining = remaining.replace(re, "");
        break;
      }
    }
  }
  if (!dueDate) {
    const nextMonMatch = remaining.match(/\bnext\s+monday\b\s*/i);
    if (nextMonMatch) {
      dueDate = formatDateISO(nextMonday());
      remaining = remaining.replace(/\bnext\s+monday\b\s*/i, "");
    } else {
      for (const [name, dayNum] of Object.entries(ENGLISH_DAYS)) {
        const re = new RegExp(`\\b${name}\\b\\s*`, "i");
        if (re.test(remaining)) {
          dueDate = formatDateISO(nextWeekday(dayNum));
          remaining = remaining.replace(re, "");
          break;
        }
      }
    }
  }

  // ── Date: "15 марта", "march 15", "15 march" ──
  if (!dueDate) {
    const ruDateMatch = remaining.match(
      /(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s*/i
    );
    if (ruDateMatch) {
      const day = parseInt(ruDateMatch[1], 10);
      const monthKey = ruDateMatch[2].toLowerCase();
      const month = MONTHS_RU[monthKey];
      if (month !== undefined) {
        const d = new Date(getToday());
        d.setDate(day);
        d.setMonth(month);
        if (d < getToday()) d.setFullYear(d.getFullYear() + 1);
        dueDate = formatDateISO(d);
        remaining = remaining.replace(
          /\d{1,2}\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s*/i,
          ""
        );
      }
    }
  }
  if (!dueDate) {
    const enDateMatch = remaining.match(
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})\b\s*/i
    );
    if (enDateMatch) {
      const monthKey = enDateMatch[1].toLowerCase();
      const day = parseInt(enDateMatch[2], 10);
      const month = MONTHS_EN[monthKey];
      if (month !== undefined) {
        const d = new Date(getToday());
        d.setDate(day);
        d.setMonth(month);
        if (d < getToday()) d.setFullYear(d.getFullYear() + 1);
        dueDate = formatDateISO(d);
        remaining = remaining.replace(
          /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}\b\s*/i,
          ""
        );
      }
    }
  }
  if (!dueDate) {
    const enDateMatch2 = remaining.match(
      /\b(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\b\s*/i
    );
    if (enDateMatch2) {
      const day = parseInt(enDateMatch2[1], 10);
      const monthKey = enDateMatch2[2].toLowerCase();
      const month = MONTHS_EN[monthKey];
      if (month !== undefined) {
        const d = new Date(getToday());
        d.setDate(day);
        d.setMonth(month);
        if (d < getToday()) d.setFullYear(d.getFullYear() + 1);
        dueDate = formatDateISO(d);
        remaining = remaining.replace(
          /\d{1,2}\s+(january|february|march|april|may|june|july|august|september|october|november|december)\b\s*/i,
          ""
        );
      }
    }
  }

  // ── Time: "в 10:00", "в 15:30", "at 10am", "at 3:30pm" ──
  const ruTimeMatch = remaining.match(/в\s+(\d{1,2}):(\d{2})\s*/i);
  if (ruTimeMatch) {
    const h = parseInt(ruTimeMatch[1], 10);
    const m = parseInt(ruTimeMatch[2], 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      dueTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
    remaining = remaining.replace(/в\s+\d{1,2}:\d{2}\s*/i, "");
  }

  if (!dueTime) {
    const enTimeMatch = remaining.match(
      /at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*/i
    );
    if (enTimeMatch) {
      let h = parseInt(enTimeMatch[1], 10);
      const m = enTimeMatch[2] ? parseInt(enTimeMatch[2], 10) : 0;
      const meridiem = enTimeMatch[3].toLowerCase();
      if (meridiem === "pm" && h < 12) h += 12;
      if (meridiem === "am" && h === 12) h = 0;
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        dueTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      }
      remaining = remaining.replace(
        /at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)\s*/i,
        ""
      );
    }
  }

  // If a time was set but no date, default to today
  if (dueTime && !dueDate) {
    dueDate = formatDateISO(getToday());
  }

  // ── Clean title ──
  const title = remaining.replace(/\s{2,}/g, " ").trim();

  return {
    title,
    dueDate,
    dueTime,
    priority,
    label,
    repeatRule,
  };
}
