'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Edit, Trash2, Receipt, Check, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { formatDateShort } from '@/lib/utils';
import type { Plan, PlanCreate, TableColumn, BreadcrumbItem } from '@/lib/types';

const EMPTY_PLAN: PlanCreate = {
  name: '',
  slug: '',
  description: '',
  monthlyPriceBRL: 0,
  stripePriceId: '',
  maxCourses: 5,
  maxModules: 10,
  maxStudents: null,
  hasAIQuizzes: false,
  hasWhatsApp: false,
  hasPrioritySupport: false,
  hasCustomModelConfig: false,
  trialDays: 7,
  displayOrder: 0,
  isActive: true,
  isCustom: false,
};

export default function PlansPage() {
  const t = useTranslations('plans');
  const tCommon = useTranslations('common');
  const { confirm, dialog } = useConfirmDialog();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState<PlanCreate>(EMPTY_PLAN);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: t('breadcrumb'), href: '/admin' },
    { label: t('title'), isCurrentPage: true },
  ];

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.getAllPlans();
      setPlans(data);
    } catch (error) {
      console.error('Failed to load plans:', error);
      toast.error(t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const filtered = plans.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.stripePriceId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreate = () => {
    setEditingPlan(null);
    setFormData(EMPTY_PLAN);
    setIsDialogOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || '',
      monthlyPriceBRL: plan.monthlyPriceBRL,
      stripePriceId: plan.stripePriceId || '',
      maxCourses: plan.maxCourses,
      maxModules: plan.maxModules,
      maxStudents: plan.maxStudents ?? null,
      hasAIQuizzes: plan.hasAIQuizzes,
      hasWhatsApp: plan.hasWhatsApp,
      hasPrioritySupport: plan.hasPrioritySupport,
      hasCustomModelConfig: plan.hasCustomModelConfig,
      trialDays: plan.trialDays,
      displayOrder: plan.displayOrder,
      isActive: plan.isActive,
      isCustom: plan.isCustom,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error(t('validationError'));
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingPlan) {
        await apiClient.updatePlan(editingPlan.id, formData);
        toast.success(t('updateSuccess'));
      } else {
        await apiClient.createPlan(formData);
        toast.success(t('createSuccess'));
      }
      setIsDialogOpen(false);
      loadPlans();
    } catch (error) {
      console.error('Failed to save plan:', error);
      toast.error(editingPlan ? t('updateError') : t('createError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (plan: Plan) => {
    confirm({
      title: t('deleteConfirm'),
      description: t('deleteConfirmDesc', { name: plan.name }),
      variant: 'destructive',
      confirmText: tCommon('buttons.delete'),
      cancelText: tCommon('buttons.cancel'),
      onConfirm: async () => {
        try {
          await apiClient.deletePlan(plan.id);
          toast.success(t('deleteSuccess'));
          loadPlans();
        } catch (error) {
          console.error('Failed to delete plan:', error);
          toast.error(t('deleteError'));
        }
      },
    });
  };

  const columns: TableColumn<Plan>[] = [
    {
      key: 'name',
      label: t('columns.name'),
      sortable: true,
      render: (_, plan) => (
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
            <Receipt className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <div className="font-medium">{plan.name}</div>
            <div className="text-sm text-muted-foreground font-mono">{plan.slug}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'monthlyPriceBRL',
      label: t('columns.price'),
      sortable: true,
      render: (value) => (
        <span className="font-mono font-medium">
          R$ {(value as number).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'stripePriceId',
      label: t('columns.stripePriceId'),
      render: (value) =>
        value ? (
          <code className="text-xs bg-muted px-2 py-1 rounded">{value as string}</code>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        ),
    },
    {
      key: 'maxCourses',
      label: t('columns.limits'),
      render: (_, plan) => (
        <div className="text-sm space-y-0.5">
          <div>{t('columns.courses')}: {plan.maxCourses}</div>
          <div>{t('columns.modules')}: {plan.maxModules}</div>
          <div>{t('columns.students')}: {plan.maxStudents ?? '\u221E'}</div>
        </div>
      ),
    },
    {
      key: 'hasAIQuizzes',
      label: t('columns.features'),
      render: (_, plan) => (
        <div className="flex flex-wrap gap-1">
          {plan.hasAIQuizzes && <Badge variant="secondary" className="text-xs">{t('features.quizzes')}</Badge>}
          {plan.hasWhatsApp && <Badge variant="secondary" className="text-xs">{t('features.whatsapp')}</Badge>}
          {plan.hasPrioritySupport && <Badge variant="secondary" className="text-xs">{t('features.priority')}</Badge>}
          {plan.hasCustomModelConfig && <Badge variant="secondary" className="text-xs">{t('features.customModel')}</Badge>}
        </div>
      ),
    },
    {
      key: 'displayOrder',
      label: t('columns.order'),
      sortable: true,
      render: (value) => <span className="font-mono">{value as number}</span>,
    },
    {
      key: 'isActive',
      label: t('columns.status'),
      render: (_, plan) => (
        <Badge variant={plan.isActive ? 'default' : 'secondary'}>
          {plan.isActive ? t('active') : t('inactive')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: tCommon('buttons.actions'),
      width: '100px',
      render: (_, plan) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEdit(plan)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(plan)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const updateField = <K extends keyof PlanCreate>(field: K, value: PlanCreate[K]) => {
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
              <DialogTitle>{editingPlan ? t('editTitle') : t('createTitle')}</DialogTitle>
              <DialogDescription>
                {editingPlan ? t('editDescription') : t('createDescription')}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-1">{t('form.name')}</label>
                <Input
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder={t('form.namePlaceholder')}
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium mb-1">{t('form.slug')}</label>
                <Input
                  value={formData.slug}
                  onChange={(e) => updateField('slug', e.target.value)}
                  placeholder={t('form.slugPlaceholder')}
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium mb-1">{t('form.price')}</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.monthlyPriceBRL}
                  onChange={(e) => updateField('monthlyPriceBRL', parseFloat(e.target.value) || 0)}
                />
              </div>

              {/* Stripe Price ID */}
              <div>
                <label className="block text-sm font-medium mb-1">{t('form.stripePriceId')}</label>
                <Input
                  value={formData.stripePriceId || ''}
                  onChange={(e) => updateField('stripePriceId', e.target.value)}
                  placeholder="price_..."
                />
              </div>

              {/* Max Courses */}
              <div>
                <label className="block text-sm font-medium mb-1">{t('form.maxCourses')}</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.maxCourses}
                  onChange={(e) => updateField('maxCourses', parseInt(e.target.value) || 0)}
                />
              </div>

              {/* Max Modules */}
              <div>
                <label className="block text-sm font-medium mb-1">{t('form.maxModules')}</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.maxModules}
                  onChange={(e) => updateField('maxModules', parseInt(e.target.value) || 0)}
                />
              </div>

              {/* Max Students */}
              <div>
                <label className="block text-sm font-medium mb-1">{t('form.maxStudents')}</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.maxStudents ?? ''}
                  onChange={(e) =>
                    updateField('maxStudents', e.target.value ? parseInt(e.target.value) : null)
                  }
                  placeholder={t('form.unlimited')}
                />
              </div>

              {/* Trial Days */}
              <div>
                <label className="block text-sm font-medium mb-1">{t('form.trialDays')}</label>
                <Input
                  type="number"
                  min="0"
                  max="365"
                  value={formData.trialDays}
                  onChange={(e) => updateField('trialDays', parseInt(e.target.value) || 0)}
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
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder={t('form.descriptionPlaceholder')}
                  rows={2}
                />
              </div>

              {/* Feature toggles */}
              <div className="col-span-2 grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm font-medium">{t('features.quizzes')}</span>
                  <Switch
                    checked={formData.hasAIQuizzes}
                    onCheckedChange={(v) => updateField('hasAIQuizzes', v)}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm font-medium">{t('features.whatsapp')}</span>
                  <Switch
                    checked={formData.hasWhatsApp}
                    onCheckedChange={(v) => updateField('hasWhatsApp', v)}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm font-medium">{t('features.priority')}</span>
                  <Switch
                    checked={formData.hasPrioritySupport}
                    onCheckedChange={(v) => updateField('hasPrioritySupport', v)}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm font-medium">{t('features.customModel')}</span>
                  <Switch
                    checked={formData.hasCustomModelConfig}
                    onCheckedChange={(v) => updateField('hasCustomModelConfig', v)}
                  />
                </div>
              </div>

              {/* Status toggles */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm font-medium">{t('form.isActive')}</span>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(v) => updateField('isActive', v)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm font-medium">{t('form.isCustom')}</span>
                <Switch
                  checked={formData.isCustom}
                  onCheckedChange={(v) => updateField('isCustom', v)}
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
                  : editingPlan
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
