'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Edit, Trash2, Shield } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { SuperAdminOnly } from '@/components/auth/role-guard';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import type { PermissionDefinition, TableColumn, BreadcrumbItem } from '@/lib/types';

interface PermissionFormData {
  code: string;
  resource: string;
  action: string;
  scope: string;
  category: string;
  description: string;
  displayOrder: number;
}

const EMPTY_PERMISSION: PermissionFormData = {
  code: '',
  resource: '',
  action: 'read',
  scope: 'global',
  category: '',
  description: '',
  displayOrder: 0,
};

const ACTIONS = ['create', 'read', 'update', 'delete', 'manage'];
const SCOPES = ['global', 'university', 'course'];

export default function AdminPermissionsPage() {
  const t = useTranslations('adminPermissions');
  const tCommon = useTranslations('common');
  const { confirm, dialog } = useConfirmDialog();

  const [permissions, setPermissions] = useState<PermissionDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<PermissionDefinition | null>(null);
  const [formData, setFormData] = useState<PermissionFormData>(EMPTY_PERMISSION);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: t('breadcrumb'), href: '/admin' },
    { label: t('title'), isCurrentPage: true },
  ];

  const loadPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.getAllPermissions();
      setPermissions(data);
    } catch (error) {
      console.error('Failed to load permissions:', error);
      toast.error(t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const filtered = permissions.filter(
    (p) =>
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreate = () => {
    setEditingPermission(null);
    setFormData(EMPTY_PERMISSION);
    setIsDialogOpen(true);
  };

  const openEdit = (permission: PermissionDefinition) => {
    setEditingPermission(permission);
    setFormData({
      code: permission.code,
      resource: permission.resource,
      action: permission.action,
      scope: permission.scope,
      category: permission.category,
      description: permission.description || '',
      displayOrder: permission.displayOrder,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.code.trim() || !formData.resource.trim() || !formData.action.trim() || !formData.category.trim()) {
      toast.error(t('validationError'));
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingPermission) {
        await apiClient.updatePermission(editingPermission.id, formData);
        toast.success(t('updateSuccess'));
      } else {
        await apiClient.createPermission(formData);
        toast.success(t('createSuccess'));
      }
      setIsDialogOpen(false);
      loadPermissions();
    } catch (error) {
      console.error('Failed to save permission:', error);
      toast.error(editingPermission ? t('updateError') : t('createError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (permission: PermissionDefinition) => {
    confirm({
      title: t('deleteConfirm'),
      description: t('deleteConfirmDesc', { code: permission.code }),
      variant: 'destructive',
      confirmText: tCommon('buttons.delete'),
      cancelText: tCommon('buttons.cancel'),
      onConfirm: async () => {
        try {
          await apiClient.deletePermission(permission.id);
          toast.success(t('deleteSuccess'));
          loadPermissions();
        } catch (error) {
          console.error('Failed to delete permission:', error);
          toast.error(t('deleteError'));
        }
      },
    });
  };

  const getScopeBadgeVariant = (scope: string) => {
    switch (scope) {
      case 'global':
        return 'default';
      case 'university':
        return 'secondary';
      case 'course':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const columns: TableColumn<PermissionDefinition>[] = [
    {
      key: 'code',
      label: t('columns.code'),
      sortable: true,
      render: (_, permission) => (
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="font-medium font-mono text-sm">{permission.code}</div>
            {permission.description && (
              <div className="text-xs text-muted-foreground truncate max-w-[200px]">{permission.description}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'resource',
      label: t('columns.resource'),
      sortable: true,
      render: (value) => <code className="text-sm bg-muted px-2 py-1 rounded">{value as string}</code>,
    },
    {
      key: 'action',
      label: t('columns.action'),
      sortable: true,
      render: (value) => <Badge variant="outline" className="capitalize">{value as string}</Badge>,
    },
    {
      key: 'scope',
      label: t('columns.scope'),
      sortable: true,
      render: (value) => (
        <Badge variant={getScopeBadgeVariant(value as string)}>
          {t(`scopes.${value as string}`)}
        </Badge>
      ),
    },
    {
      key: 'category',
      label: t('columns.category'),
      sortable: true,
      render: (value) => <span className="text-sm">{value as string}</span>,
    },
    {
      key: 'displayOrder',
      label: t('columns.order'),
      sortable: true,
      render: (value) => <span className="font-mono">{value as number}</span>,
    },
    {
      key: 'actions',
      label: tCommon('buttons.actions'),
      width: '100px',
      render: (_, permission) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEdit(permission)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(permission)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const updateField = <K extends keyof PermissionFormData>(field: K, value: PermissionFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <SuperAdminOnly>
      <div className="space-y-6">
        <PageHeader
          title={t('title')}
          description={t('description')}
          breadcrumbs={breadcrumbs}
          actions={
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t('createButton')}
            </Button>
          }
        />

        <DataTable
          data={filtered}
          columns={columns}
          loading={loading}
          search={{
            value: searchTerm,
            placeholder: t('searchPlaceholder'),
            onSearchChange: setSearchTerm,
          }}
          emptyMessage={t('emptyMessage')}
        />

        {/* Create / Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPermission ? t('editTitle') : t('createTitle')}</DialogTitle>
              <DialogDescription>
                {editingPermission ? t('editDescription') : t('createDescription')}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium mb-1">{t('form.code')}</label>
                <Input
                  value={formData.code}
                  onChange={(e) => updateField('code', e.target.value)}
                  placeholder={t('form.codePlaceholder')}
                />
              </div>

              {/* Resource */}
              <div>
                <label className="block text-sm font-medium mb-1">{t('form.resource')}</label>
                <Input
                  value={formData.resource}
                  onChange={(e) => updateField('resource', e.target.value)}
                  placeholder={t('form.resourcePlaceholder')}
                />
              </div>

              {/* Action */}
              <div>
                <label className="block text-sm font-medium mb-1">{t('form.action')}</label>
                <Select value={formData.action} onValueChange={(v) => updateField('action', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIONS.map((action) => (
                      <SelectItem key={action} value={action} className="capitalize">
                        {action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Scope */}
              <div>
                <label className="block text-sm font-medium mb-1">{t('form.scope')}</label>
                <Select value={formData.scope} onValueChange={(v) => updateField('scope', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCOPES.map((scope) => (
                      <SelectItem key={scope} value={scope}>
                        {t(`scopes.${scope}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-1">{t('form.category')}</label>
                <Input
                  value={formData.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  placeholder={t('form.categoryPlaceholder')}
                />
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-sm font-medium mb-1">{t('form.displayOrder')}</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.displayOrder}
                  onChange={(e) => updateField('displayOrder', parseInt(e.target.value) || 0)}
                />
              </div>

              {/* Description (full width) */}
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">{t('form.description')}</label>
                <Input
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder={t('form.descriptionPlaceholder')}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {tCommon('buttons.cancel')}
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting
                  ? t('saving')
                  : editingPermission
                    ? tCommon('buttons.save')
                    : t('createButton')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {dialog}
      </div>
    </SuperAdminOnly>
  );
}
