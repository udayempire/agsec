import type { SelectHTMLAttributes } from "react";

export function Select({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-200 shadow-sm outline-none transition-colors focus-visible:border-amber-400 focus-visible:ring-1 focus-visible:ring-amber-400/40 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
