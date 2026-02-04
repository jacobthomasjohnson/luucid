"use client";

import Image from "next/image";

export default function ThemeLogo({
  alt = "Luucid",
  width = 120,
  height = 28,
  priority = false,
  className = "",
}) {
  // Render stable markup (both logos) and let CSS pick the visible one.
  // This avoids hydration mismatches caused by reading theme on the client.
  return (
    <span className={className}>
      <Image
        src="/logo.svg"
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className="luucid-logo luucid-logo--light"
      />
      <Image
        src="/logo_white.svg"
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className="luucid-logo luucid-logo--dark"
      />
    </span>
  );
}
