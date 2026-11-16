import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  /** Omit href for the current page (rendered as plain text). */
  href?: string;
}

/**
 * Accessible breadcrumb trail. The JSON-LD variant is rendered separately by
 * pages that need it (see components/seo/JsonLd).
 */
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        <li className="flex items-center gap-1">
          <Link href="/" className="flex items-center gap-1 transition-colors hover:text-foreground">
            <Home className="size-3.5" aria-hidden />
            Beranda
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1">
            <ChevronRight className="size-3.5 text-muted-foreground/50" aria-hidden />
            {item.href ? (
              <Link href={item.href} className="transition-colors hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="max-w-[16rem] truncate text-foreground/90 sm:max-w-xs">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
