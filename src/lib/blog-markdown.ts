/**
 * Convert blog markdown to HTML for storage in the database.
 * Handles headings, bold, italic, links, lists, blockquotes, tables, and horizontal rules.
 * Blog body goes through sanitizeHtml() at render time for XSS protection.
 */
export function blogMarkdownToHtml(md: string): string {
  const lines = md.split("\n");
  const blocks: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (trimmed === "") {
      i++;
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(trimmed)) {
      blocks.push("<hr>");
      i++;
      continue;
    }

    // Heading
    const headingMatch = trimmed.match(/^(#{1,3}) (.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      blocks.push(`<h${level}>${inlineFmt(headingMatch[2])}</h${level}>`);
      i++;
      continue;
    }

    // Table (requires at least 2 consecutive pipe-delimited rows)
    if (trimmed.startsWith("|") && i + 1 < lines.length && lines[i + 1].trim().startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      blocks.push(renderTable(tableLines));
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("> ")) {
        quoteLines.push(lines[i].trim().slice(2));
        i++;
      }
      blocks.push(`<blockquote><p>${quoteLines.map(inlineFmt).join("<br>")}</p></blockquote>`);
      continue;
    }

    // Unordered list
    if (/^- /.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^- /.test(lines[i].trim())) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      blocks.push(`<ul>${items.map((item) => `<li>${inlineFmt(item)}</li>`).join("")}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\d+\. /.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push(`<ol>${items.map((item) => `<li>${inlineFmt(item)}</li>`).join("")}</ol>`);
      continue;
    }

    // Paragraph — collect consecutive non-special lines
    const paraLines: string[] = [];
    while (i < lines.length) {
      const l = lines[i].trim();
      if (
        l === "" ||
        /^#{1,3} /.test(l) ||
        /^---+$/.test(l) ||
        l.startsWith("|") ||
        /^- /.test(l) ||
        /^\d+\. /.test(l) ||
        l.startsWith("> ")
      )
        break;
      paraLines.push(l);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push(`<p>${paraLines.map(inlineFmt).join(" ")}</p>`);
    }
  }

  return blocks.join("\n");
}

/** Apply inline formatting: bold, italic, links */
function inlineFmt(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

/** Convert pipe-delimited markdown table rows to HTML table */
function renderTable(rows: string[]): string {
  const parsed = rows.map((row) =>
    row
      .split("|")
      .map((cell) => cell.trim())
      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1),
  );

  if (parsed.length < 2) return "";

  const header = parsed[0];
  const bodyRows = parsed.slice(2); // skip header + separator

  let html = "<table><thead><tr>";
  for (const cell of header) {
    html += `<th>${inlineFmt(cell)}</th>`;
  }
  html += "</tr></thead><tbody>";
  for (const row of bodyRows) {
    html += "<tr>";
    for (const cell of row) {
      html += `<td>${inlineFmt(cell)}</td>`;
    }
    html += "</tr>";
  }
  html += "</tbody></table>";
  return html;
}
