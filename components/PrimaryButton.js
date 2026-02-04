"use client";

export default function PrimaryButton({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-full px-4 py-3 text-base font-medium transition-[background-color,color,box-shadow,transform] duration-200 ease-out active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

  const styles =
    variant === "secondary"
      ? "bg-transparent text-zinc-700 hover:bg-zinc-100/80"
      : variant === "white"
        ? "bg-white text-zinc-900 hover:bg-zinc-50"
        : variant === "danger"
          ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
          : "bg-zinc-900 text-white hover:bg-zinc-800";

  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}
