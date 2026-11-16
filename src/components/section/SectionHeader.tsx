import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface SectionHeaderProps {
  overline?: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
  /** Heading level for document outline correctness. */
  as?: "h2" | "h3";
}

/** Consistent section header used across catalog pages. */
export function SectionHeader({ overline, title, description, action, as = "h2" }: SectionHeaderProps) {
  const Heading = as;
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {overline ? <p className="overline-label">{overline}</p> : null}
        <Heading className="mt-1 text-lg font-semibold tracking-tight sm:text-xl">{title}</Heading>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="flex items-center gap-1.5 text-sm text-primary transition-opacity hover:opacity-85"
        >
          {action.label}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}
