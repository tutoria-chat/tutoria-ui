'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
        
        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden lg:ml-0">
          {/* Header */}
          <Header 
            onMenuToggle={toggleSidebar}
            isSidebarOpen={isSidebarOpen}
          />
          
          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            <div className="container max-w-screen-2xl py-6 px-4">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}