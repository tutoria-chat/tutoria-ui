'use client';

import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  ChevronDown,
  Folder,
  List,
  ClipboardList,
  Bot,
  CreditCard,
  Receipt,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { useAuth } from '@/components/auth/auth-provider';
import { RoleGuard, SuperAdminOnly, AdminOnly, ProfessorOnly } from '@/components/auth/role-guard';
import type { NavigationItem, UserRole } from '@/lib/types';
import { FEATURE_FLAGS } from '@/lib/constants';
import { useNavigationContext } from '@/lib/hooks/use-navigation-context';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ isOpen = true, onClose, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const t = useTranslations('sidebar');
  const navContext = useNavigationContext();
  const [isUniversityExpanded, setIsUniversityExpanded] = useState(true);

  // Track whether we're on a desktop-sized screen (lg: = 1024px)
  // Collapse mode should ONLY apply on desktop — never on mobile
  const [isLgScreen, setIsLgScreen] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    setIsLgScreen(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsLgScreen(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // On mobile, always show expanded sidebar regardless of localStorage
  const collapsed = isCollapsed && isLgScreen;

  if (!user) return null;

  // Check if we're inside a university context
  const hasUniversityContext = !!navContext.university;

  const navigationItems: NavigationItem[] = [
    {
      label: t('dashboard'),
      href: '/dashboard',
      icon: Home,
    },
    ...(FEATURE_FLAGS.TUTORIALS_ENABLED ? [{
      label: t('tutorials'),
      href: '/tutorials',
      icon: BookOpen,
      requiredPermission: 'courses:read',
    }] : []),
    {
      label: t('universities'),
      href: '/universities',
      icon: Building2,
      requiredPermission: 'universities:read',
    },
    {
      label: t('moduleTokens'),
      href: '/tokens',
      icon: Key,
      requiredPermission: 'tokens:read',
    },
    {
      label: t('subscription'),
      href: '/subscription',
      icon: CreditCard,
      requiredPermission: 'subscription:manage',
    },
  ];

  const adminItems: NavigationItem[] = [
    {
      label: t('analytics'),
      href: '/analytics',
      icon: BarChart3,
      requiredPermission: 'analytics:read',
    },
    {
      label: t('aiModels'),
      href: '/models',
      icon: Bot,
      requiredPermission: 'universities:read',
    },
    {
      label: t('plans'),
      href: '/admin/plans',
      icon: Receipt,
      requiredPermission: 'universities:read',
    },
    {
      label: t('subscriptions'),
      href: '/admin/subscriptions',
      icon: CreditCard,
      requiredPermission: 'universities:read',
    },
    {
      label: t('permissions'),
      href: '/admin/permissions',
      icon: Shield,
      requiredPermission: 'universities:read',
    },
    {
      label: t('auditLogs'),
      href: '/audit-logs',
      icon: ClipboardList,
      requiredPermission: 'analytics:read',
    },
    {
      label: t('users'),
      href: '/users',
      icon: Users,
      requiredPermission: 'staff:read',
    },
    {
      label: t('superAdmins'),
      href: '/admin/super-admins',
      icon: Shield,
      requiredPermission: 'universities:read',
    },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const shouldShowItem = (item: NavigationItem) => {
    if (user.role === 'super_admin') return item.href !== '/subscription';
    if (item.requiredPermission) {
      return user.permissions?.includes(item.requiredPermission) ?? false;
    }
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.includes(user.role);
  };

  const handleItemClick = () => {
    if (onClose) {
      onClose();
    }
  };

  const hasAdminAccess = user.role === 'super_admin' || (user.permissions?.includes('staff:create') ?? false);

  // Render a navigation item (handles both expanded and collapsed states)
  const renderNavItem = (item: NavigationItem) => {
    const active = isActive(item.href);
    const button = (
      <Button
        variant={active ? "secondary" : "ghost"}
        className={cn(
          "w-full transition-all duration-200 text-base h-11",
          collapsed
            ? "justify-center px-0"
            : "justify-start hover:translate-x-1",
          active && "bg-primary/10 shadow-sm font-semibold rounded-lg",
          !active && "rounded-lg"
        )}
      >
        {item.icon && (
          <item.icon
            className={cn(
              collapsed ? "h-5 w-5" : "mr-3 h-5 w-5",
              active && "text-primary"
            )}
          />
        )}
        {!collapsed && (
          <>
            <span className={cn(active && "text-primary")}>{item.label}</span>
            {active && (
              <ChevronRight className="ml-auto h-5 w-5 text-primary" />
            )}
          </>
        )}
      </Button>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.href}>
          <TooltipTrigger asChild>
            <Link href={item.href} onClick={handleItemClick} className="block">
              {button}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Link key={item.href} href={item.href} onClick={handleItemClick} className="block">
        {button}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <div
        className={cn(
          // Base styles
          "fixed z-50 flex flex-col overflow-hidden",
          "bg-sidebar",
          "transition-all duration-300 ease-in-out",

          // Border: right-only on mobile, all sides on desktop
          "border-r border-sidebar-border lg:border lg:border-sidebar-border",

          // Desktop: floating with padding from edges
          "lg:top-3 lg:left-3 lg:bottom-3 lg:rounded-2xl lg:shadow-xl",
          "dark:lg:shadow-[0_0_40px_rgba(0,0,0,0.5)] dark:ring-1 dark:ring-white/[0.06]",

          // Desktop width
          collapsed
            ? "lg:w-[72px]"
            : "lg:w-64",

          // Mobile: full-height slide-in from left, clean edge
          "top-0 left-0 bottom-0 w-72 shadow-2xl rounded-none",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="relative flex h-full flex-col overflow-hidden">
          {/* Logo area */}
          <div className={cn(
            "flex h-20 items-center shrink-0",
            collapsed ? "justify-center px-2" : "justify-center px-4"
          )}>
            <Link
              href="/dashboard"
              className="flex items-center overflow-hidden transition-transform hover:scale-105 duration-200"
              onClick={handleItemClick}
            >
              {collapsed ? (
                <Image
                  src="/favicon.svg"
                  alt="Tutoria"
                  width={32}
                  height={32}
                  priority
                  unoptimized
                  className="h-8 w-8 object-contain"
                />
              ) : (
                <Image
                  src="/Color_01.png"
                  alt="Tutoria Logo"
                  width={200}
                  height={72}
                  priority
                  quality={100}
                  sizes="200px"
                  className="h-12 w-auto max-w-full object-contain drop-shadow-md"
                />
              )}
            </Link>
          </div>

          {/* Thin separator */}
          <div className="mx-3 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden py-4">
            <nav className={cn("space-y-1", collapsed ? "px-2" : "px-3")}>
              {navigationItems
                .filter(shouldShowItem)
                .map(renderNavItem)}

              {/* My University - Professor only (not super admins, they have the full Universities list) */}
              {user?.role !== 'super_admin' && <ProfessorOnly>
                <div>
                  {collapsed ? (
                    // Collapsed: icon only with tooltip
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={pathname.includes('/universities/') ? "secondary" : "ghost"}
                          className={cn(
                            "w-full justify-center px-0 transition-all duration-200 text-base h-11 rounded-lg",
                            pathname.includes('/universities/') && "bg-primary/10 shadow-sm font-semibold"
                          )}
                          onClick={() => {
                            const href = user.universityId ? `/universities/${user.universityId}` : '/universities';
                            window.location.href = href;
                          }}
                        >
                          <Building2 className={cn("h-5 w-5", pathname.includes('/universities/') && "text-primary")} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        {hasUniversityContext && navContext.university ? navContext.university.name : t('myUniversity')}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    // Expanded: full button with collapsible sub-nav
                    <>
                      <Button
                        variant={pathname.includes('/universities/') ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start transition-all duration-200 hover:translate-x-1 text-base h-11 rounded-lg",
                          pathname.includes('/universities/') && "bg-primary/10 shadow-sm font-semibold"
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

                      {/* Collapsible sub-navigation */}
                      {hasUniversityContext && isUniversityExpanded && (
                        <div className="ml-4 mt-1 space-y-1">
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
                                  "w-full justify-start text-sm h-9 pl-3 rounded-lg",
                                  pathname.includes(`/courses/${navContext.course.id}`) && "bg-primary/5 text-primary"
                                )}
                              >
                                <BookOpen className="mr-2 h-4 w-4" />
                                <span className="truncate">{navContext.course.name}</span>
                              </Button>
                            </Link>
                          )}

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
                                  "w-full justify-start text-sm h-9 pl-6 rounded-lg",
                                  pathname.includes(`/modules/${navContext.module.id}`) && "bg-primary/5 text-primary"
                                )}
                              >
                                <FileText className="mr-2 h-3 w-3" />
                                <span className="truncate">{navContext.module.name}</span>
                              </Button>
                            </Link>
                          )}

                          {(navContext.course || navContext.module) && (
                            <div className="h-px bg-border/50 my-2" />
                          )}

                          <Link
                            href={`/courses?universityId=${navContext.universityId}`}
                            onClick={handleItemClick}
                            className="block"
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-sm h-9 pl-3 text-muted-foreground hover:text-foreground rounded-lg"
                            >
                              <List className="mr-2 h-4 w-4" />
                              {t('allCourses') || 'All Courses'}
                            </Button>
                          </Link>

                          <Link
                            href={`/modules?universityId=${navContext.universityId}`}
                            onClick={handleItemClick}
                            className="block"
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-sm h-9 pl-3 text-muted-foreground hover:text-foreground rounded-lg"
                            >
                              <List className="mr-2 h-4 w-4" />
                              {t('allModules') || 'All Modules'}
                            </Button>
                          </Link>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </ProfessorOnly>}
            </nav>

            {/* Admin Section */}
            {hasAdminAccess && (
              <div className="mt-6">
                <div className={cn(
                  "mx-3 mb-3 h-px bg-gradient-to-r from-transparent via-border to-transparent",
                  collapsed && "mx-2"
                )} />
                {!collapsed && (
                  <div className="px-3 py-2">
                    <div className="mb-3 px-2 flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-bold text-primary uppercase tracking-wider">
                        {t('administration')}
                      </h3>
                    </div>
                  </div>
                )}
                <div className={cn("space-y-1", collapsed ? "px-2" : "px-3")}>
                  {adminItems
                    .filter(shouldShowItem)
                    .map(renderNavItem)}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={cn(
            "shrink-0 p-3",
            collapsed ? "flex flex-col items-center gap-2" : ""
          )}>
            {/* Thin separator above footer */}
            <div className={cn(
              "h-px bg-gradient-to-r from-transparent via-border/50 to-transparent mb-3",
              collapsed ? "mx-0 w-full" : "mx-0"
            )} />

            {!collapsed && (
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center space-x-2 text-sm font-medium">
                  <div className="relative">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  </div>
                  <span className="text-green-600 dark:text-green-400 text-xs">{t('systemOnline')}</span>
                </div>
                <span className="text-xs text-muted-foreground opacity-60">{t('version')}</span>
              </div>
            )}

            {collapsed && (
              <div className="relative mb-1">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              </div>
            )}

            {/* Collapse toggle button — desktop only */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleCollapse}
                  className={cn(
                    "hidden lg:flex rounded-lg text-muted-foreground hover:text-foreground",
                    collapsed ? "w-full justify-center px-0" : "w-full justify-start"
                  )}
                >
                  {collapsed ? (
                    <PanelLeftOpen className="h-4 w-4" />
                  ) : (
                    <>
                      <PanelLeftClose className="mr-2 h-4 w-4" />
                      <span className="text-sm">{t('collapse') || 'Collapse'}</span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {collapsed ? (t('expand') || 'Expand sidebar') : (t('collapse') || 'Collapse sidebar')}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </>
  );
}
