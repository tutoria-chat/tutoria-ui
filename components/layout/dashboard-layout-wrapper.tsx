'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  // Read localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('tutoria_sidebar_collapsed');
    if (stored === 'true') {
      setIsCollapsed(true);
    }
    setHasMounted(true);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('tutoria_sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
        />

        {/* Main content */}
        {/* On mobile (< lg): no margin, sidebar is overlay */}
        {/* On desktop (lg+): margin-left matches sidebar width + offset */}
        <div
          className={cn(
            "flex flex-1 flex-col overflow-hidden",
            "lg:transition-[margin-left] lg:duration-300 lg:ease-in-out",
            // Desktop margins — sidebar is fixed/floating so content needs offset
            hasMounted
              ? (isCollapsed ? "lg:ml-[96px]" : "lg:ml-[280px]")
              : "lg:ml-[280px]"
          )}
        >
          {/* Header */}
          <Header
            onMenuToggle={toggleSidebar}
            isSidebarOpen={isSidebarOpen}
          />

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-[1920px] 2xl:max-w-[2200px]">
              <div className="max-w-[1600px] mx-auto">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
