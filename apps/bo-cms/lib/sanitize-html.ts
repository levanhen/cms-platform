import sanitizeHtmlLib from "sanitize-html";

const ALLOWED_TAGS = [
  "p",
  "br",
  "hr",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "sub",
  "sup",
  "mark",
  "blockquote",
  "pre",
  "code",
  "ul",
  "ol",
  "li",
  "a",
  "img",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "colgroup",
  "col",
  "span",
  "div",
  "iframe",
];

const OPTIONS: sanitizeHtmlLib.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    a: ["href", "target", "rel", "title", "class"],
    img: ["src", "alt", "title", "width", "height", "class"],
    iframe: [
      "src",
      "width",
      "height",
      "allow",
      "allowfullscreen",
      "frameborder",
      "referrerpolicy",
      "title",
      "class",
    ],
    table: ["class", "width"],
    th: ["colspan", "rowspan", "align", "class"],
    td: ["colspan", "rowspan", "align", "class"],
    col: ["span", "width"],
    colgroup: ["span"],
    "*": ["class", "style"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: {
    img: ["http", "https", "data"],
  },
  allowProtocolRelative: false,
  allowedIframeHostnames: ["www.youtube.com", "youtube.com", "www.youtube-nocookie.com", "youtube-nocookie.com"],
  transformTags: {
    a: sanitizeHtmlLib.simpleTransform("a", { rel: "noopener noreferrer" }),
  },
};

function clean(html: string) {
  return sanitizeHtmlLib(html, OPTIONS).trim();
}

/** Sanitize TipTap HTML before persisting to the database. */
export function sanitizeHtml(html: string | null | undefined) {
  if (!html) return null;
  const cleaned = clean(html);
  return cleaned.length > 0 ? cleaned : null;
}
