import React from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayoutClient } from './dashboard-layout-client';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <DashboardLayoutClient>{children}</DashboardLayoutClient>
    </ProtectedRoute>
  );
}