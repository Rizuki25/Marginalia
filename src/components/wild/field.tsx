import type * as React from "react";
import { cn } from "cn";

/** Label + control pair. Every field gets a visible label (R-39). */
export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="label text-ink">
          {label}
        </label>
        {hint ? <span className="label-sm text-muted-foreground">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

const controlClass =
  "w-full rounded-[6px] border border-line bg-paper px-3 py-2.5 font-sans text-[15px] text-ink placeholder:text-muted-foreground transition-colors hover:border-ink/30 focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50 aria-[invalid=true]:border-danger-fill";

export function TextInput({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(controlClass, "h-11", className)} {...props} />;
}

export function TextArea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(controlClass, "min-h-24 resize-y", className)} {...props} />;
}

export function NativeSelect({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select className={cn(controlClass, "h-11 appearance-none pr-8", className)} {...props}>
      {children}
    </select>
  );
}

export function CheckboxRow({
  id,
  label,
  description,
  ...props
}: React.ComponentProps<"input"> & { id: string; label: string; description?: string }) {
  return (
    <div className="flex items-start gap-3 border border-line p-3">
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 accent-ink"
        {...props}
      />
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="label text-ink">
          {label}
        </label>
        {description ? (
          <span className="text-[13px] leading-snug text-muted-foreground">
            {description}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function FormMessage({
  status,
  message,
}: {
  status: "idle" | "success" | "error";
  message: string;
}) {
  if (status === "idle" || !message) return null;
  return (
    <p
      role={status === "error" ? "alert" : "status"}
      className={cn(
        "border-l-2 pl-3 text-[13px] leading-snug",
        status === "error"
          ? "border-danger-fill text-danger"
          : "border-ink text-ink",
      )}
    >
      {message}
    </p>
  );
}
