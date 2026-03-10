'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { apiClient } from '@/lib/api';
import type { PermissionDefinition } from '@/lib/types';
import { Shield, Lock } from 'lucide-react';

interface PermissionEditorProps {
  /** Current role (to show role defaults as disabled checked checkboxes) */
  role: string;
  /** Currently selected extra permission IDs */
  extraPermissionIds: number[];
  /** Callback when extras change */
  onChange: (ids: number[]) => void;
  /** When form is submitting */
  disabled?: boolean;
}

export function PermissionEditor({
  role,
  extraPermissionIds,
  onChange,
  disabled = false,
}: PermissionEditorProps) {
  const t = useTranslations('permissionEditor');

  const [allPermissions, setAllPermissions] = useState<PermissionDefinition[]>([]);
  const [rolePermissions, setRolePermissions] = useState<PermissionDefinition[]>([]);
  const [isLoadingAll, setIsLoadingAll] = useState(true);
  const [isLoadingRole, setIsLoadingRole] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all permissions on mount
  useEffect(() => {
    const fetchAll = async () => {
      setIsLoadingAll(true);
      setError(null);
      try {
        const perms = await apiClient.getAllPermissions();
        setAllPermissions(perms);
      } catch (err) {
        console.error('Failed to fetch permissions:', err);
        setError(t('loadError'));
      } finally {
        setIsLoadingAll(false);
      }
    };
    fetchAll();
  }, [t]);

  // Fetch role permissions when role changes
  useEffect(() => {
    if (!role) {
      setRolePermissions([]);
      return;
    }

    const fetchRolePerms = async () => {
      setIsLoadingRole(true);
      try {
        const perms = await apiClient.getRolePermissions(role);
        setRolePermissions(perms);
      } catch (err) {
        console.error('Failed to fetch role permissions:', err);
        // Don't set error - role defaults are informational
        setRolePermissions([]);
      } finally {
        setIsLoadingRole(false);
      }
    };
    fetchRolePerms();
  }, [role]);

  // Set of role default permission IDs for quick lookup
  const rolePermissionIds = new Set(rolePermissions.map(p => p.id));

  // Group permissions by category
  const groupedPermissions = allPermissions.reduce<Record<string, PermissionDefinition[]>>((acc, perm) => {
    const category = perm.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(perm);
    return acc;
  }, {});

  // Sort categories and permissions within each category
  const sortedCategories = Object.keys(groupedPermissions).sort((a, b) => {
    const aOrder = Math.min(...groupedPermissions[a].map(p => p.displayOrder));
    const bOrder = Math.min(...groupedPermissions[b].map(p => p.displayOrder));
    return aOrder - bOrder;
  });

  const handleToggle = useCallback((permId: number, checked: boolean) => {
    if (checked) {
      onChange([...extraPermissionIds, permId]);
    } else {
      onChange(extraPermissionIds.filter(id => id !== permId));
    }
  }, [extraPermissionIds, onChange]);

  const getActionLabel = (action: string): string => {
    switch (action) {
      case 'create': return t('actions.create');
      case 'read': return t('actions.read');
      case 'update': return t('actions.update');
      case 'delete': return t('actions.delete');
      case 'manage': return t('actions.manage');
      default: return action;
    }
  };

  const getCategoryLabel = (category: string): string => {
    // Try translation key first, fallback to capitalized category name
    try {
      return t(`categories.${category}`);
    } catch {
      return category.charAt(0).toUpperCase() + category.slice(1);
    }
  };

  if (isLoadingAll) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" className="text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (allPermissions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">{t('title')}</CardTitle>
        </div>
        <CardDescription>
          {t('description')}
        </CardDescription>
        {role && (
          <div className="flex items-center gap-2 mt-2">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {t('roleDefaultsHint')}
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoadingRole && (
          <div className="flex items-center justify-center py-4">
            <LoadingSpinner size="sm" className="text-primary" />
          </div>
        )}

        {!isLoadingRole && sortedCategories.map((category) => {
          const permissions = groupedPermissions[category].sort(
            (a, b) => a.displayOrder - b.displayOrder
          );

          return (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-foreground">
                  {getCategoryLabel(category)}
                </h4>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-1">
                {permissions.map((perm) => {
                  const isRoleDefault = rolePermissionIds.has(perm.id);
                  const isExtraChecked = extraPermissionIds.includes(perm.id);
                  const isChecked = isRoleDefault || isExtraChecked;

                  return (
                    <div
                      key={perm.id}
                      className="flex items-center gap-2 py-1"
                    >
                      <Checkbox
                        id={`perm-${perm.id}`}
                        checked={isChecked}
                        disabled={disabled || isRoleDefault}
                        onCheckedChange={(checked) => {
                          if (!isRoleDefault) {
                            handleToggle(perm.id, checked === true);
                          }
                        }}
                      />
                      <Label
                        htmlFor={`perm-${perm.id}`}
                        className={`text-sm cursor-pointer select-none ${
                          isRoleDefault
                            ? 'text-muted-foreground'
                            : 'text-foreground'
                        }`}
                      >
                        {getActionLabel(perm.action)}
                        {isRoleDefault && (
                          <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0">
                            {t('roleDefault')}
                          </Badge>
                        )}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {extraPermissionIds.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              {t('extraCount', { count: extraPermissionIds.length })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
