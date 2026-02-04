"use client";

export default function PrimaryButton({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-full px-4 py-3 text-base font-medium transition-[background-color,color,box-shadow,transform] duration-200 ease-out active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-(--luucid-bg-bottom) disabled:opacity-50 disabled:pointer-events-none";

  const styles =
    variant === "secondary"
      ? "bg-transparent text-(--luucid-btn-secondary-fg) hover:bg-(--luucid-btn-secondary-hover-bg)"
      : variant === "white"
        ? "border border-(--luucid-btn-white-border) bg-(--luucid-btn-white-bg) text-(--luucid-btn-white-fg) hover:bg-(--luucid-btn-white-hover-bg)"
        : variant === "danger"
          ? "bg-(--luucid-btn-danger-bg) text-(--luucid-btn-danger-fg) hover:bg-(--luucid-btn-danger-hover-bg)"
          : "border border-(--luucid-accent-border) hover:border-(--luucid-accent-hover-border) bg-(--luucid-accent-bg) text-(--luucid-accent-fg) hover:bg-(--luucid-accent-hover-bg)";

  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}
