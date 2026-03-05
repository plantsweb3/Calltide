/**
 * Shared CSV parser for data import.
 * Handles quoted fields, commas in values, and escaped quotes.
 */

export interface ColumnMapping<T> {
  field: keyof T;
  aliases: string[];
  required?: boolean;
  transform?: (val: string) => unknown;
}

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}

/**
 * Parse a single CSV line handling quoted fields and escaped quotes.
 */
export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Split CSV text into logical lines, respecting quoted fields that may contain newlines.
 */
function splitCsvLines(text: string): string[] {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      current += char;
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === "\n" || (char === "\r" && text[i + 1] === "\n")) && !inQuotes) {
      if (current.trim()) lines.push(current);
      current = "";
      if (char === "\r") i++;
    } else {
      current += char;
    }
  }
  if (current.trim()) lines.push(current);
  return lines;
}

/**
 * Parse full CSV text into headers and rows.
 */
export function parseCsv(text: string): ParsedCsv {
  const lines = splitCsvLines(text);
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parseCsvLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")
  );

  const rows: string[][] = [];
  for (let i = 1; i < lines.length; i++) {
    rows.push(parseCsvLine(lines[i]));
  }

  return { headers, rows };
}

/**
 * Map a CSV row to an entity using column aliases.
 * Returns the mapped fields and any missing required fields.
 */
export function mapColumns<T>(
  headers: string[],
  row: string[],
  mappings: ColumnMapping<T>[]
): { data: Partial<T>; missing: string[] } {
  const data: Partial<T> = {};
  const missing: string[] = [];

  for (const mapping of mappings) {
    const idx = headers.findIndex((h) =>
      mapping.aliases.some((alias) => h === alias.toLowerCase().replace(/\s+/g, "_"))
    );

    const rawValue = idx >= 0 ? (row[idx] ?? "").trim() : "";

    if (!rawValue && mapping.required) {
      missing.push(String(mapping.field));
      continue;
    }

    if (rawValue) {
      const value = mapping.transform ? mapping.transform(rawValue) : rawValue;
      (data as Record<string, unknown>)[String(mapping.field)] = value;
    }
  }

  return { data, missing };
}

/** Max file size for imports: 5MB */
export const MAX_IMPORT_FILE_SIZE = 5 * 1024 * 1024;
