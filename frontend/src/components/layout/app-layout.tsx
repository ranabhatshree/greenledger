"use client";

import { useState, useEffect } from "react";
import { TopNav } from "../dashboard/top-nav";
import { Sidebar } from "../dashboard/sidebar";
import { ProtectedRoute } from "../auth/protected-route";
import { AppFooter } from "./app-footer";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load collapsed state from localStorage
    // const savedCollapsedState = localStorage.getItem('sidebarCollapsed') || "true";
    // if (savedCollapsedState) {
    //   setSidebarCollapsed(JSON.parse(savedCollapsedState));
    // }
    setSidebarCollapsed(true);
  }, []);

  const toggleSidebarCollapse = () => {
    const newCollapsedState = !sidebarCollapsed;
    setSidebarCollapsed(newCollapsedState);
    // Save to localStorage
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newCollapsedState));
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <header className="print:hidden">
          <TopNav 
            onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
            onToggleCollapse={toggleSidebarCollapse}
            isCollapsed={sidebarCollapsed}
          />
        </header>
        <div className="flex flex-1 pt-[73px]">
          <Sidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)}
            isCollapsed={sidebarCollapsed}
          />
          <main 
            className={`flex-1 flex flex-col overflow-y-auto h-[calc(100vh-73px)] px-4 py-6 lg:px-6 lg:py-8 print:!p-0 transition-all duration-200 ease-in-out ${
              sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
            }`}
          >
            {children}
            <AppFooter />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
} 