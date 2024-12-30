"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { menuItems } from "@/data/dashboard-data";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Helper function to check if a route is active
  const isRouteActive = (href: string): boolean => {
    // For root path
    if (href === '/') {
      return pathname === '/';
    }
    // For other paths, remove trailing slash for comparison
    const normalizedPathname = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
    const normalizedHref = href.endsWith('/') ? href.slice(0, -1) : href;
    return normalizedPathname === normalizedHref || normalizedPathname.startsWith(`${normalizedHref}/`);
  };

  if (!isMounted) return null;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 max-h-screen overflow-y-auto transform border-r bg-white px-6 py-8 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between lg:hidden">
          <h2 className="font-semibold">Menu</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isRouteActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                  isActive
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}