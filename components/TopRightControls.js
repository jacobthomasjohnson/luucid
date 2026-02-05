"use client";

import HelpButton from "./HelpButton";
import ThemeToggle from "./ThemeToggle";

export default function TopRightControls() {
  return (
    <div
      className="fixed right-4 z-50 flex items-center gap-2"
      style={{ top: "calc(1rem + env(safe-area-inset-top))" }}
    >
      <HelpButton />
      <ThemeToggle />
    </div>
  );
}