import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Allows safe tags (headings, lists, links, images, tables, formatting)
 * but strips scripts, event handlers, and dangerous attributes.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "br", "hr",
      "strong", "b", "em", "i", "u", "s", "del",
      "ul", "ol", "li",
      "a", "img",
      "table", "thead", "tbody", "tr", "th", "td",
      "blockquote", "pre", "code",
      "div", "span",
      "figure", "figcaption",
    ],
    ALLOWED_ATTR: [
      "href", "target", "rel",
      "src", "alt", "width", "height",
      "class", "style",
      "colspan", "rowspan",
    ],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ["target"],
    // Force all links to open in new tab safely
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "textarea", "select", "button"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
  });
}
