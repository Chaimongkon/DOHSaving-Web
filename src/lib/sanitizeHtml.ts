import DOMPurify from "isomorphic-dompurify";

let hooksConfigured = false;

function configureHooks() {
  if (hooksConfigured) return;

  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if ("getAttribute" in node && "setAttribute" in node) {
      const target = node.getAttribute("target");
      if (target === "_blank") {
        node.setAttribute("rel", "noopener noreferrer");
      }
    }
  });

  hooksConfigured = true;
}

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Allows safe tags (headings, lists, links, images, tables, formatting)
 * but strips scripts, event handlers, and dangerous attributes.
 */
export function sanitizeHtml(dirty: string): string {
  configureHooks();

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
      "class",
      "colspan", "rowspan",
    ],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ["target"],
    // Force all links to open in new tab safely
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "textarea", "select", "button"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
  });
}
