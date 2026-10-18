import type { HTMLAttributes } from "react";

type DivProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: DivProps) {
  return (
    <div
      className={`rounded-xl border border-zinc-800 bg-zinc-950 shadow-sm shadow-black/20 ${className}`}
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }: DivProps) {
  return (
    <div
      className={`flex items-start justify-between gap-4 border-b border-zinc-800 px-6 py-5 ${className}`}
      {...props}
    />
  );
}

export function CardTitle({
  className = "",
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={`text-base font-semibold tracking-[-0.02em] text-zinc-100 ${className}`}
      {...props}
    />
  );
}

export function CardDescription({
  className = "",
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={`mt-1 text-xs leading-5 text-zinc-500 ${className}`}
      {...props}
    />
  );
}

export function CardContent({ className = "", ...props }: DivProps) {
  return <div className={`p-6 ${className}`} {...props} />;
}
