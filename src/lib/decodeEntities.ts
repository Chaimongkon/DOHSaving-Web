// Reverses the legacy character-entity encoding applied by older QnA/complaints
// write paths (e.g. "/" stored as "&#x2F;"). React already escapes interpolated
// text on render, so this is purely for displaying historical data correctly.
export function decodeEntities(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}
