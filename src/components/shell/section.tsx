import type { ReactNode } from "react";

/**
 * Section row: a mono index and label sit in a left margin, separated by a
 * hairline rule. This is the "marginalia" motif: the page reads like a book
 * with notes in the margin.
 */
export function Section({
  index,
  title,
  aside,
  children,
}: {
  index: string;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="grid grid-cols-1 gap-y-5 border-t border-line pt-6 md:grid-cols-[132px_minmax(0,1fr)] md:gap-x-10">
      <div className="flex items-baseline gap-3 md:sticky md:top-6 md:flex-col md:items-start md:gap-1.5 md:self-start md:border-r md:border-line md:pr-6">
        <span className="num text-[11px] leading-none text-muted-foreground">
          {index}
        </span>
        <h2 className="label text-ink">{title}</h2>
        {aside}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
