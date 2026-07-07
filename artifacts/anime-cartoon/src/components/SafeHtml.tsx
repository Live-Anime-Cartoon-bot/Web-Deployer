/**
 * Renders trusted admin-entered HTML after sanitizing it with DOMPurify.
 * Use instead of dangerouslySetInnerHTML for any DB-sourced HTML content.
 */
import DOMPurify from "dompurify";

interface Props {
  html: string;
  className?: string;
}

export function SafeHtml({ html, className }: Props) {
  const clean = DOMPurify.sanitize(html, {
    // Allow common rich-text tags; block scripts/iframes.
    ALLOWED_TAGS: [
      "p", "br", "b", "i", "em", "strong", "a", "ul", "ol", "li",
      "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "code",
      "img", "figure", "figcaption", "table", "thead", "tbody", "tr", "th", "td",
      "span", "div", "hr",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "class", "target", "rel"],
    // Ensure links open safely
    ALLOW_UNKNOWN_PROTOCOLS: false,
    FORCE_BODY: true,
  });

  return (
    <div
      className={className}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
