export function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]*>/g, "").trim();
}

export function sanitizeContent(text: string, maxLength: number = 5000): string {
  let clean = stripHtmlTags(text);
  if (clean.length > maxLength) clean = clean.slice(0, maxLength);
  return clean;
}
