/**
 * Allowlist-based HTML sanitizer for rendering user/admin-generated HTML safely.
 * Strips dangerous tags (script, iframe, etc.), event handlers, and javascript: URLs.
 */
const ALLOWED_TAGS = new Set([
  "p", "br", "b", "i", "em", "strong", "u", "s", "a",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "blockquote", "pre", "code",
  "table", "thead", "tbody", "tr", "th", "td",
  "img", "figure", "figcaption", "hr", "span", "div",
  "sup", "sub", "mark", "small",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
  img: new Set(["src", "alt", "width", "height", "loading"]),
  td: new Set(["colspan", "rowspan"]),
  th: new Set(["colspan", "rowspan"]),
  "*": new Set(["class", "id", "style"]),
};

export function sanitizeHtml(html: string): string {
  return html
    // Remove script/iframe/object/embed/form tags and their content
    .replace(/<(script|iframe|object|embed|form|style|link|meta|base)[\s\S]*?<\/\1>/gi, "")
    .replace(/<(script|iframe|object|embed|form|style|link|meta|base)[^>]*\/?>/gi, "")
    // Remove all event handlers (any attribute starting with on, regardless of quote style)
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "")
    // Remove javascript:, data:, vbscript: from href/src attributes
    .replace(/(href|src|action|formaction)\s*=\s*(?:"[^"]*(?:javascript|data|vbscript)\s*:[^"]*"|'[^']*(?:javascript|data|vbscript)\s*:[^']*')/gi, "")
    // Remove any remaining tags not in allowlist
    .replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, tag) => {
      if (ALLOWED_TAGS.has(tag.toLowerCase())) {
        // For allowed tags, strip disallowed attributes
        return match.replace(/\s+([a-zA-Z-]+)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/g, (attrMatch, attrName) => {
          const tagAttrs = ALLOWED_ATTRS[tag.toLowerCase()];
          const globalAttrs = ALLOWED_ATTRS["*"];
          if (tagAttrs?.has(attrName.toLowerCase()) || globalAttrs?.has(attrName.toLowerCase())) {
            return attrMatch;
          }
          return "";
        });
      }
      return "";
    });
}
