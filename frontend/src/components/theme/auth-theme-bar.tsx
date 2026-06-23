"use client";

import { ThemeToggle } from "@/components/theme/theme-toggle";

export function AuthThemeBar() {
  return (
    <div className="fixed top-4 right-4 z-50 print:hidden">
      <ThemeToggle />
    </div>
  );
}
