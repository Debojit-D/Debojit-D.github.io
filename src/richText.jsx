// Shared text helpers used by both the home sections and the blog.

export function renderRichText(content) {
  if (!Array.isArray(content)) return content;

  return content.map((part, index) => {
    if (typeof part === "string") return part;
    const body = part.strong ? <strong>{part.text}</strong> : part.text;

    if (part.href) {
      const isInternal = part.href.startsWith("#");
      return (
        <a
          key={`${part.href}-${index}`}
          href={part.href}
          target={isInternal ? undefined : "_blank"}
          rel={isInternal ? undefined : "noreferrer"}
        >
          {body}
        </a>
      );
    }

    return <span key={`${part.text}-${index}`}>{body}</span>;
  });
}

export function richTextToPlain(content) {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return String(content);
  return content.map((part) => (typeof part === "string" ? part : part.text ?? "")).join("");
}

export function slugify(value = "") {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
