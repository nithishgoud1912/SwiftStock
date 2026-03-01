"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full w-9 h-9 opacity-50 relative overflow-hidden"
      >
        <span className="sr-only">Toggle theme loading</span>
      </Button>
    );
  }

  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-full relative w-9 h-9 text-gray-500 hover:text-gray-900 bg-transparent hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors duration-300"
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-transform duration-500 will-change-transform"
        style={{
          transform: isDark ? "rotate(-40deg)" : "rotate(90deg)",
        }}
      >
        <mask id="moon-mask">
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          <circle
            cx={isDark ? "12" : "24"}
            cy={isDark ? "4" : "10"}
            r="6"
            fill="black"
            className="transition-all duration-500 ease-in-out"
          />
        </mask>
        <circle
          cx="12"
          cy="12"
          r={isDark ? "9" : "5"}
          fill="currentColor"
          mask="url(#moon-mask)"
          className="transition-all duration-500 ease-in-out"
        />

        {/* Sun Rays */}
        <g
          style={{
            opacity: isDark ? 0 : 1,
            transform: isDark
              ? "scale(0.5) rotate(-45deg)"
              : "scale(1) rotate(0deg)",
            transformOrigin: "center center",
          }}
          className="transition-all duration-500 ease-in-out"
        >
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </g>
      </svg>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
