import React from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayoutWrapper } from '@/components/layout/dashboard-layout-wrapper';
import type { UserRole } from '@/lib/types';

export const dynamic = 'force-dynamic';

// Students must NEVER access the dashboard — they use the student app / widget only
const DASHBOARD_ALLOWED_ROLES: UserRole[] = [
  'super_admin',
  'manager',
  'tutor',
  'platform_coordinator',
  'professor',
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={DASHBOARD_ALLOWED_ROLES}>
      <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>
    </ProtectedRoute>
  );
}
