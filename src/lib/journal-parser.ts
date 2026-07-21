export interface ParsedSegment {
  type: "text" | "task" | "file";
  content: string;
  id?: string;
}

export function parseJournalContent(text: string): ParsedSegment[] {
  const segments: ParsedSegment[] = [];
  const regex = /\[\[(task|file):([^\]]+)\]\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: match[1] as "task" | "file", content: match[2], id: match[2] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", content: text.slice(lastIndex) });
  }

  return segments;
}

export function insertLink(text: string, cursorPos: number, type: "task" | "file", id: string, label: string): string {
  const before = text.slice(0, cursorPos);
  const after = text.slice(cursorPos);
  const link = `[[${type}:${id}]]`;
  return before + link + after;
}
