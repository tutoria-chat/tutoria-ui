import React from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayoutWrapper } from '@/components/layout/dashboard-layout-wrapper';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>
    </ProtectedRoute>
  );
}