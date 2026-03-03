/**
 * Converts markdown to HTML for legal document rendering.
 * Supports: headings, bold, italic, bullets, tables, links.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function processTable(lines: string[]): string {
  if (lines.length < 2) return lines.join("\n");

  const parseRow = (line: string) =>
    line.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

  const headers = parseRow(lines[0]);
  // Skip separator row (lines[1])
  const dataRows = lines.slice(2).map(parseRow);

  const th = headers
    .map(
      (h) =>
        `<th style="border:1px solid #ddd;padding:8px 12px;background:#f8f8f8;text-align:left;font-weight:600;">${h}</th>`,
    )
    .join("");

  const tbody = dataRows
    .map(
      (row) =>
        `<tr>${row.map((c) => `<td style="border:1px solid #ddd;padding:8px 12px;">${c}</td>`).join("")}</tr>`,
    )
    .join("");

  return `<div style="overflow-x:auto;margin:16px 0;"><table style="width:100%;border-collapse:collapse;font-size:0.9rem;"><thead><tr>${th}</tr></thead><tbody>${tbody}</tbody></table></div>`;
}

export function legalMarkdown(md: string): string {
  const escaped = escapeHtml(md);
  const lines = escaped.split("\n");
  const processed: string[] = [];
  let i = 0;

  // First pass: convert markdown tables to HTML
  while (i < lines.length) {
    if (
      lines[i].trim().startsWith("|") &&
      i + 1 < lines.length &&
      lines[i + 1].trim().startsWith("|")
    ) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      processed.push(processTable(tableLines));
    } else {
      processed.push(lines[i]);
      i++;
    }
  }

  return processed
    .join("\n")
    .replace(
      /^### (.+)$/gm,
      '<h3 style="font-size:1.1rem;font-weight:600;margin:24px 0 8px;color:#1A1D24;">$1</h3>',
    )
    .replace(
      /^## (.+)$/gm,
      '<h2 style="font-size:1.25rem;font-weight:600;margin:32px 0 12px;color:#1A1D24;">$1</h2>',
    )
    .replace(
      /^# (.+)$/gm,
      '<h1 style="font-size:1.75rem;font-weight:700;margin:0 0 16px;color:#1A1D24;">$1</h1>',
    )
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" style="color:#C59A27;text-decoration:underline;">$1</a>',
    )
    .replace(/\n- /g, "<br>• ")
    .replace(/\n\n/g, "<br><br>")
    .replace(/\n/g, "<br>");
}
