import type { InputHTMLAttributes } from "react";

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 shadow-sm outline-none transition-colors placeholder:text-zinc-600 focus-visible:border-amber-400 focus-visible:ring-1 focus-visible:ring-amber-400/40 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
