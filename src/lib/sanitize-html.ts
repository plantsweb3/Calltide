import DOMPurify from "isomorphic-dompurify";

/**
 * Allowlist-based HTML sanitizer backed by DOMPurify. Strips scripts, event
 * handlers, inline styles, and dangerous URL schemes — covers the edge cases
 * (encoded URIs, SVG/MathML, foreignObject) that a naive regex sanitizer misses.
 */
const ALLOWED_TAGS = [
  "p", "br", "b", "i", "em", "strong", "u", "s", "a",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "blockquote", "pre", "code",
  "table", "thead", "tbody", "tr", "th", "td",
  "img", "figure", "figcaption", "hr", "span", "div",
  "sup", "sub", "mark", "small",
];

const ALLOWED_ATTRS = [
  "href", "title", "target", "rel",
  "src", "alt", "width", "height", "loading",
  "colspan", "rowspan",
  "class", "id",
];

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ALLOWED_ATTRS,
    // No inline styles — blocks CSS-based data exfil and expression() legacy.
    FORBID_ATTR: ["style"],
    // Disallow MathML / SVG which can embed script via foreignObject.
    USE_PROFILES: { html: true },
    // href/src schemes: allow only http(s) and mailto/tel; strip javascript:/data:/vbscript:.
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|ftp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
}
