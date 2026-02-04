'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
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
  ChevronDown,
  Folder,
  List
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/auth-provider';
import { RoleGuard, SuperAdminOnly, AdminOnly, ProfessorOnly } from '@/components/auth/role-guard';
import type { NavigationItem, UserRole } from '@/lib/types';
import { FEATURE_FLAGS } from '@/lib/constants';
import { useNavigationContext } from '@/lib/hooks/use-navigation-context';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const t = useTranslations('sidebar');
  const navContext = useNavigationContext();
  const [isUniversityExpanded, setIsUniversityExpanded] = useState(true);

  if (!user) return null;

  // Check if we're inside a university context
  const hasUniversityContext = !!navContext.university;

  const navigationItems: NavigationItem[] = [
    {
      label: t('dashboard'),
      href: '/dashboard',
      icon: Home,
    },
    // Tutorials link - controlled by feature flag
    ...(FEATURE_FLAGS.TUTORIALS_ENABLED ? [{
      label: t('tutorials'),
      href: '/tutorials',
      icon: BookOpen,
      roles: ['super_admin', 'professor'] as UserRole[],
    }] : []),
    {
      label: t('universities'),
      href: '/universities',
      icon: Building2,
      roles: ['super_admin'],
    },
    {
      label: t('moduleTokens'),
      href: '/tokens',
      icon: Key,
      roles: ['super_admin', 'professor'],
      requiresAdmin: true, // Only admin professors
    },
  ];

  const adminItems: NavigationItem[] = [
    {
      label: t('analytics'),
      href: '/analytics',
      icon: BarChart3,
      roles: ['super_admin', 'manager'],
    },
    // TODO: Re-enable System Overview page when backend endpoints are ready
    // {
    //   label: t('systemOverview'),
    //   href: '/admin',
    //   icon: BarChart3,
    //   roles: ['super_admin'],
    // },
    {
      label: t('users'),
      href: '/users',
      icon: Users,
      roles: ['super_admin', 'manager'],
    },
    {
      label: t('superAdmins'),
      href: '/admin/super-admins',
      icon: Shield,
      roles: ['super_admin'],
    },
    {
      label: t('globalSearch'),
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

    // Check if user's role is in the allowed roles
    if (!item.roles.includes(user.role)) return false;

    // Legacy: If requiresAdmin is true, check if user is admin professor (for backward compatibility)
    if (item.requiresAdmin && user.role === 'professor') {
      return user.isAdmin === true;
    }

    return true;
  };

  const handleItemClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform bg-muted/30 backdrop-blur-sm border-r border-border/50 shadow-lg transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
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

      <div className="relative flex h-full w-64 flex-col bg-gradient-to-b from-background via-background to-muted/20 overflow-hidden">
        {/* Header with gradient background */}
        <div className="flex h-20 items-center justify-center border-b border-border/50 px-4 shrink-0 bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5">
          <Link
            href="/dashboard"
            className="flex items-center space-x-2 overflow-hidden transition-transform hover:scale-105 duration-200"
            onClick={handleItemClick}
          >
            <Image
              src="/Color_01.png"
              alt="Tutoria Logo"
              width={4008}
              height={1438}
              priority
              className="h-12 w-auto max-w-full object-contain drop-shadow-md"
            />
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-6">
          <nav className="px-3 space-y-1.5">
            {navigationItems
              .filter(shouldShowItem)
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleItemClick}
                  className="block"
                >
                  <Button
                    variant={isActive(item.href) ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start transition-all duration-200 hover:translate-x-1 text-base h-11",
                      isActive(item.href) && "bg-primary/10 border-l-2 border-primary shadow-sm font-semibold"
                    )}
                  >
                    {item.icon && <item.icon className={cn("mr-3 h-5 w-5", isActive(item.href) && "text-primary")} />}
                    <span className={cn(isActive(item.href) && "text-primary")}>{item.label}</span>
                    {isActive(item.href) && (
                      <ChevronRight className="ml-auto h-5 w-5 text-primary" />
                    )}
                  </Button>
                </Link>
              ))}

            {/* My University - Enhanced with collapsible sub-navigation for professors */}
            <ProfessorOnly>
              <div>
                {/* Main university button */}
                <Button
                  variant={pathname.includes('/universities/') ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start transition-all duration-200 hover:translate-x-1 text-base h-11",
                    pathname.includes('/universities/') && "bg-primary/10 border-l-2 border-primary shadow-sm font-semibold"
                  )}
                  onClick={() => {
                    if (hasUniversityContext) {
                      setIsUniversityExpanded(!isUniversityExpanded);
                    } else {
                      const href = user.universityId ? `/universities/${user.universityId}` : '/universities';
                      window.location.href = href;
                    }
                  }}
                >
                  <Building2 className={cn("mr-3 h-5 w-5", pathname.includes('/universities/') && "text-primary")} />
                  <span className={cn(pathname.includes('/universities/') && "text-primary")}>
                    {hasUniversityContext && navContext.university ? navContext.university.name : t('myUniversity')}
                  </span>
                  {hasUniversityContext && (
                    isUniversityExpanded ?
                      <ChevronDown className="ml-auto h-4 w-4" /> :
                      <ChevronRight className="ml-auto h-4 w-4" />
                  )}
                </Button>

                {/* Collapsible sub-navigation - only shown when inside university context */}
                {hasUniversityContext && isUniversityExpanded && (
                  <div className="ml-4 mt-1 space-y-1">
                    {/* Current course */}
                    {navContext.course && (
                      <Link
                        href={`/courses/${navContext.course.id}`}
                        onClick={handleItemClick}
                        className="block"
                      >
                        <Button
                          variant={pathname.includes(`/courses/${navContext.course.id}`) ? "secondary" : "ghost"}
                          size="sm"
                          className={cn(
                            "w-full justify-start text-sm h-9 pl-3",
                            pathname.includes(`/courses/${navContext.course.id}`) && "bg-primary/5 text-primary"
                          )}
                        >
                          <BookOpen className="mr-2 h-4 w-4" />
                          <span className="truncate">{navContext.course.name}</span>
                        </Button>
                      </Link>
                    )}

                    {/* Current module */}
                    {navContext.module && (
                      <Link
                        href={`/modules/${navContext.module.id}`}
                        onClick={handleItemClick}
                        className="block"
                      >
                        <Button
                          variant={pathname.includes(`/modules/${navContext.module.id}`) ? "secondary" : "ghost"}
                          size="sm"
                          className={cn(
                            "w-full justify-start text-sm h-9 pl-6",
                            pathname.includes(`/modules/${navContext.module.id}`) && "bg-primary/5 text-primary"
                          )}
                        >
                          <FileText className="mr-2 h-3 w-3" />
                          <span className="truncate">{navContext.module.name}</span>
                        </Button>
                      </Link>
                    )}

                    {/* Separator */}
                    {(navContext.course || navContext.module) && (
                      <div className="h-px bg-border/50 my-2" />
                    )}

                    {/* Quick link to all courses */}
                    <Link
                      href={`/courses?universityId=${navContext.universityId}`}
                      onClick={handleItemClick}
                      className="block"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-sm h-9 pl-3 text-muted-foreground hover:text-foreground"
                      >
                        <List className="mr-2 h-4 w-4" />
                        {t('allCourses') || 'All Courses'}
                      </Button>
                    </Link>

                    {/* Quick link to all modules */}
                    <Link
                      href={`/modules?universityId=${navContext.universityId}`}
                      onClick={handleItemClick}
                      className="block"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-sm h-9 pl-3 text-muted-foreground hover:text-foreground"
                      >
                        <List className="mr-2 h-4 w-4" />
                        {t('allModules') || 'All Modules'}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </ProfessorOnly>
          </nav>

          {/* Admin Section - Shows for Super Admins and Admin Professors */}
          <AdminOnly>
            <div className="mt-8">
              <div className="mx-3 mb-4 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              <div className="px-3 py-2">
                <div className="mb-3 px-2 flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-primary uppercase tracking-wider">
                    {t('administration')}
                  </h3>
                </div>
                <div className="space-y-1.5">
                  {adminItems
                    .filter(shouldShowItem)
                    .map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={handleItemClick}
                        className="block"
                      >
                        <Button
                          variant={isActive(item.href) ? "secondary" : "ghost"}
                          className={cn(
                            "w-full justify-start transition-all duration-200 hover:translate-x-1 text-base h-11",
                            isActive(item.href) && "bg-primary/10 border-l-2 border-primary shadow-sm font-semibold"
                          )}
                        >
                          {item.icon && <item.icon className={cn("mr-3 h-5 w-5", isActive(item.href) && "text-primary")} />}
                          <span className={cn(isActive(item.href) && "text-primary")}>{item.label}</span>
                          {isActive(item.href) && (
                            <ChevronRight className="ml-auto h-5 w-5 text-primary" />
                          )}
                        </Button>
                      </Link>
                    ))}
                </div>
              </div>
            </div>
          </AdminOnly>
        </div>

        {/* Footer */}
        <div className="border-t border-border/50 bg-gradient-to-r from-muted/20 to-muted/5 p-4 shrink-0">
          <div className="flex items-center space-x-2 text-base font-medium">
            <div className="relative">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse"></div>
              <div className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-green-500/30 animate-ping"></div>
            </div>
            <span className="text-green-600 dark:text-green-400">{t('systemOnline')}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
            <span>{t('version')}</span>
            <span className="text-xs opacity-60">Tutoria AI</span>
          </div>
        </div>
      </div>
    </div>
  );
}