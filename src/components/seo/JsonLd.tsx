/**
 * JSON-LD structured data renderer. Values are JSON.stringify-ed with
 * angle brackets escaped so user-derived text can never break out of the
 * script element.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      // Structured data must be embedded verbatim; content is escaped above.
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

/** Google "BreadcrumbList" structured data. */
export function breadcrumbJsonLd(
  items: { name: string; href: string }[],
  origin: string,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${origin}${item.href}`,
    })),
  };
}
