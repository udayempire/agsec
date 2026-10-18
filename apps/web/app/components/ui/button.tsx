import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm";
};

const variants = {
  default: "bg-orange-500 text-zinc-950 hover:bg-amber-400",
  outline:
    "border border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-orange-700 hover:bg-zinc-800",
  ghost: "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100",
};

const sizes = {
  default: "h-10 px-4",
  sm: "h-9 px-3",
};

export function Button({
  className = "",
  variant = "default",
  size = "default",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      type={type}
      {...props}
    />
  );
}
