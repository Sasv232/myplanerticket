export interface KeyBinding {
  key: string;
  note: string;
}

export const WHITE_NOTES = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5", "F5", "G5", "A5", "B5"];
export const BLACK_NOTES = ["C#4", "D#4", "F#4", "G#4", "A#4", "C#5", "D#5", "F#5", "G#5", "A#5"];

export const ALL_NOTES = [...WHITE_NOTES, ...BLACK_NOTES];

export const DEFAULT_BINDINGS: Record<string, string> = {
  "й": "C4", "ц": "D4", "у": "E4", "к": "F4", "е": "G4", "н": "A4", "г": "B4",
  "ш": "C5", "щ": "D5", "з": "E5", "х": "F5", "ъ": "G5", "\\": "A5", "]": "B5",
  "ф": "C#4", "ы": "D#4", "в": "F#4", "а": "G#4", "п": "A#4",
  "р": "C#5", "о": "D#5", "л": "F#5", "д": "G#5", "ж": "A#5",
};

export const STORAGE_KEY = "synth-keybindings";

export function loadBindings(): Record<string, string> {
  if (typeof window === "undefined") return DEFAULT_BINDINGS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed === "object" && parsed !== null) {
        return { ...DEFAULT_BINDINGS, ...parsed };
      }
    }
  } catch {}
  return { ...DEFAULT_BINDINGS };
}

export function saveBindings(bindings: Record<string, string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings));
}

export function getReverseBindings(bindings: Record<string, string>): Record<string, string> {
  const reverse: Record<string, string> = {};
  for (const [key, note] of Object.entries(bindings)) {
    reverse[note] = key;
  }
  return reverse;
}

export function getNoteLabel(note: string): string {
  return note.replace("#", "");
}
