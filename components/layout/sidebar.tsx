'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Building2, 
  BookOpen, 
  FileText, 
  Users, 
  GraduationCap, 
  Key, 
  Upload,
  BarChart3,
  Settings,
  Shield,
  Search,
  ChevronRight,
  Folder
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/auth-provider';
import { RoleGuard, SuperAdminOnly, AdminOnly, ProfessorOnly } from '@/components/auth/role-guard';
import type { NavigationItem } from '@/lib/types';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const navigationItems: NavigationItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: Home,
    },
    {
      label: 'Universidades',
      href: '/universities',
      icon: Building2,
      roles: ['super_admin'],
    },
    {
      label: 'Minha Universidade',
      href: user.university_id ? `/universities/${user.university_id}` : '/universities',
      icon: Building2,
      roles: ['professor'],
    },
    {
      label: 'Tokens de Módulos',
      href: '/tokens',
      icon: Key,
      roles: ['super_admin', 'professor'],
    },
  ];

  const adminItems: NavigationItem[] = [
    {
      label: 'Visão Geral do Sistema',
      href: '/admin',
      icon: BarChart3,
      roles: ['super_admin'],
    },
    {
      label: 'Super Administradores',
      href: '/admin/super-admins',
      icon: Shield,
      roles: ['super_admin'],
    },
    {
      label: 'Busca Global',
      href: '/admin/global-search',
      icon: Search,
      roles: ['super_admin'],
    },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const shouldShowItem = (item: NavigationItem) => {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.includes(user.role);
  };

  const handleItemClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform bg-background border-r border-border transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 lg:hidden"
          onClick={onClose}
        />
      )}

      <div className="relative flex h-full w-64 flex-col bg-background">
        {/* Header */}
        <div className="flex h-14 items-center border-b border-border px-3">
          <Link
            href="/dashboard"
            className="flex items-center space-x-2"
            onClick={handleItemClick}
          >
            <Image
              src="/Color_01.png"
              alt="Tutoria Logo"
              width={120}
              height={32}
              priority
              className="h-8 w-auto"
            />
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-3 space-y-1">
            {navigationItems
              .filter(shouldShowItem)
              .map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  onClick={handleItemClick}
                >
                  <Button
                    variant={isActive(item.href) ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    size="sm"
                  >
                    {item.icon && <item.icon className="mr-3 h-4 w-4" />}
                    {item.label}
                    {isActive(item.href) && (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </Button>
                </Link>
              ))}
          </nav>

          {/* Admin Section */}
          <SuperAdminOnly>
            <div className="mt-6">
              <Separator className="mx-3" />
              <div className="px-3 py-2">
                <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Administração
                </h3>
                <div className="space-y-1">
                  {adminItems
                    .filter(shouldShowItem)
                    .map((item) => (
                      <Link 
                        key={item.href} 
                        href={item.href}
                        onClick={handleItemClick}
                      >
                        <Button
                          variant={isActive(item.href) ? "secondary" : "ghost"}
                          className="w-full justify-start"
                          size="sm"
                        >
                          {item.icon && <item.icon className="mr-3 h-4 w-4" />}
                          {item.label}
                          {isActive(item.href) && (
                            <ChevronRight className="ml-auto h-4 w-4" />
                          )}
                        </Button>
                      </Link>
                    ))}
                </div>
              </div>
            </div>
          </SuperAdminOnly>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-3">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span>System Online</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Version 1.0.0
          </div>
        </div>
      </div>
    </div>
  );
}