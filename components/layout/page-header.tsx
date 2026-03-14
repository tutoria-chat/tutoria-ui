'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from './breadcrumbs';
import type { BreadcrumbItem } from '@/lib/types';

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export function PageHeader({ 
  title, 
  description, 
  breadcrumbs = [], 
  actions,
  children 
}: PageHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} />
      )}
      
      {/* Title and Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl truncate">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground sm:text-base">{description}</p>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
      
      {/* Additional content */}
      {children}
    </div>
  );
}