import type { ReactNode } from "react";

interface LegalPageShellProps {
  title: string;
  updated: string;
  children: ReactNode;
}

/**
 * Shared layout for legal pages (Terms, Privacy, Copyright/DMCA, Contact).
 * Child typography is styled through scoped utilities so legal content can
 * be plain semantic HTML.
 */
export function LegalPageShell({ title, updated, children }: LegalPageShellProps) {
  return (
    <div className="mx-auto w-full max-w-3xl px-1 py-8">
      <p className="overline-label">Legal</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-2 text-xs text-muted-foreground">Terakhir diperbarui: {updated}</p>
      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline-offset-2 hover:[&_a]:underline [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:font-medium [&_h3]:text-foreground [&_li]:leading-relaxed [&_p+ul]:mt-2 [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </div>
  );
}
