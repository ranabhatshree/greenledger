"use client";

import { useState, useEffect } from "react";
import { TopNav } from "./top-nav";
import { Sidebar } from "./sidebar";

interface DashboardLayoutWrapperProps {
  children: React.ReactNode;
}

export function DashboardLayoutWrapper({ children }: DashboardLayoutWrapperProps) {
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <TopNav onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 pt-[73px]">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 flex flex-col overflow-y-auto h-[calc(100vh-73px)] px-4 py-6 lg:px-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
} 