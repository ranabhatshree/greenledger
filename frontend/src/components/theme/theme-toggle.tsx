"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ThemeToggleProps {
  showLabel?: boolean;
}

export function ThemeToggle({ showLabel = false }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="flex items-center gap-2"
        aria-hidden="true"
      >
        <Sun className="h-4 w-4 text-muted-foreground" />
        <div className="h-6 w-11 rounded-full bg-muted" />
        <Moon className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <div className="flex items-center gap-2">
      <Sun
        className={`h-4 w-4 ${isDark ? "text-muted-foreground" : "text-foreground"}`}
        aria-hidden="true"
      />
      <Switch
        id="theme-toggle"
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label="Toggle dark mode"
      />
      <Moon
        className={`h-4 w-4 ${isDark ? "text-foreground" : "text-muted-foreground"}`}
        aria-hidden="true"
      />
      {showLabel && (
        <Label htmlFor="theme-toggle" className="sr-only">
          Dark mode
        </Label>
      )}
    </div>
  );
}
