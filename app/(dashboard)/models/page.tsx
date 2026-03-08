'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bot, Key, Settings2, Building2, Plus, Edit, Trash2, Power, PowerOff } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { SuperAdminOnly } from '@/components/auth/role-guard';
import { useFetch } from '@/lib/hooks';
import { apiClient } from '@/lib/api';
import { formatDateShort } from '@/lib/utils';
import type {
  AIModel,
  ProviderKey,
  ProviderKeyCreate,
  CourseTypeModel,
  CourseTypeModelCreate,
  TableColumn,
  BreadcrumbItem,
} from '@/lib/types';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';

// ==================== AI Models Tab ====================
function AIModelsTab() {
  const t = useTranslations('models.aiModels');
  const tCommon = useTranslations('common');
  const [searchTerm, setSearchTerm] = useState('');
  const { confirm, dialog } = useConfirmDialog();

  const { data: aiModels, loading } = useFetch<AIModel[]>('/api/ai-models/');

  const models = aiModels || [];
  const filtered = models.filter(m =>
    m.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.modelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.provider?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: TableColumn<AIModel>[] = [
    {
      key: 'displayName',
      label: t('columns.name'),
      sortable: true,
      render: (_, model) => (
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
            <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="font-medium">{model.displayName}</div>
            <div className="text-sm text-muted-foreground font-mono">{model.modelName}</div>
          </div>
        </div>
      )
    },
    {
      key: 'provider',
      label: t('columns.provider'),
      sortable: true,
      render: (value) => (
        <Badge variant="outline" className="capitalize">{value as string}</Badge>
      )
    },
    {
      key: 'isActive',
      label: t('columns.status'),
      render: (_, model) => (
        <div className="flex items-center gap-2">
          <Badge variant={model.isActive ? 'default' : 'secondary'}>
            {model.isActive ? t('active') : t('inactive')}
          </Badge>
          {model.isDeprecated && (
            <Badge variant="destructive">{t('deprecated')}</Badge>
          )}
        </div>
      )
    },
    {
      key: 'inputCostPer1M',
      label: t('columns.inputCost'),
      render: (value) => (
        <span className="text-sm font-mono">
          {value != null ? `$${(value as number).toFixed(2)}` : 'N/A'}
        </span>
      )
    },
    {
      key: 'outputCostPer1M',
      label: t('columns.outputCost'),
      render: (value) => (
        <span className="text-sm font-mono">
          {value != null ? `$${(value as number).toFixed(2)}` : 'N/A'}
        </span>
      )
    },
    {
      key: 'requiredTier',
      label: t('columns.tier'),
      render: (value) => {
        const tier = value as number;
        const tierLabels: Record<number, string> = { 1: 'Basic', 2: 'Standard', 3: 'Premium' };
        return <Badge variant="outline">{tierLabels[tier] || `Tier ${tier}`}</Badge>;
      }
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        data={filtered}
        columns={columns}
        loading={loading}
        search={{
          value: searchTerm,
          placeholder: t('searchPlaceholder'),
          onSearchChange: setSearchTerm
        }}
        emptyMessage={t('emptyMessage')}
      />
      {dialog}
    </div>
  );
}

// ==================== API Keys Tab ====================
function APIKeysTab() {
  const t = useTranslations('models.apiKeys');
  const tCommon = useTranslations('common');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newKey, setNewKey] = useState<ProviderKeyCreate>({
    provider: 'openai',
    keyName: '',
    apiKey: '',
    region: '',
    priority: 1,
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { confirm, dialog } = useConfirmDialog();

  const { data: providerKeys, loading } = useFetch<ProviderKey[]>('/api/provider-keys/');

  const keys = providerKeys || [];
  const filtered = keys.filter(k =>
    k.keyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.provider?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateKey = async () => {
    if (!newKey.keyName.trim() || !newKey.apiKey.trim()) {
      toast.error(t('validationError'));
      return;
    }
    setIsSubmitting(true);
    try {
      await apiClient.createProviderKey(newKey);
      toast.success(t('createSuccess'));
      setIsCreateOpen(false);
      setNewKey({ provider: 'openai', keyName: '', apiKey: '', region: '', priority: 1, isActive: true });
      window.location.reload();
    } catch (error) {
      console.error('Failed to create provider key:', error);
      toast.error(t('createError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteKey = async (id: number) => {
    confirm({
      title: t('deleteConfirm'),
      description: t('deleteConfirmDesc'),
      variant: 'destructive',
      confirmText: tCommon('buttons.delete'),
      cancelText: tCommon('buttons.cancel'),
      onConfirm: async () => {
        try {
          await apiClient.deleteProviderKey(id);
          toast.success(t('deleteSuccess'));
          window.location.reload();
        } catch (error) {
          console.error('Failed to delete provider key:', error);
          toast.error(t('deleteError'));
        }
      }
    });
  };

  const columns: TableColumn<ProviderKey>[] = [
    {
      key: 'keyName',
      label: t('columns.name'),
      sortable: true,
      render: (_, key) => (
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
            <Key className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="font-medium">{key.keyName}</div>
            <div className="text-sm text-muted-foreground font-mono">
              {key.maskedKey || '***...****'}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'provider',
      label: t('columns.provider'),
      sortable: true,
      render: (value) => (
        <Badge variant="outline" className="capitalize">{value as string}</Badge>
      )
    },
    {
      key: 'priority',
      label: t('columns.priority'),
      sortable: true,
      render: (value) => <span className="font-mono">{value as number}</span>
    },
    {
      key: 'isActive',
      label: t('columns.status'),
      render: (_, key) => (
        <div className="flex items-center gap-2">
          <Badge variant={key.isActive ? 'default' : 'secondary'}>
            {key.isActive ? t('active') : t('inactive')}
          </Badge>
          {key.failureCount > 0 && (
            <Badge variant="destructive">{t('failures', { count: key.failureCount })}</Badge>
          )}
        </div>
      )
    },
    {
      key: 'lastUsedAt',
      label: t('columns.lastUsed'),
      render: (value) => value ? formatDateShort(value as string) : t('never')
    },
    {
      key: 'actions',
      label: t('columns.actions'),
      width: '80px',
      render: (_, key) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDeleteKey(key.id)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      )
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('addKey')}
        </Button>
      </div>

      <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <Key className="inline h-4 w-4 mr-1" />
            {t('encryptionNotice')}
          </p>
        </CardContent>
      </Card>

      <DataTable
        data={filtered}
        columns={columns}
        loading={loading}
        search={{
          value: searchTerm,
          placeholder: t('searchPlaceholder'),
          onSearchChange: setSearchTerm
        }}
        emptyMessage={t('emptyMessage')}
      />

      {/* Create Key Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('createTitle')}</DialogTitle>
            <DialogDescription>{t('createDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('form.provider')}</label>
              <Select value={newKey.provider} onValueChange={(v) => setNewKey(prev => ({ ...prev, provider: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('form.keyName')}</label>
              <Input
                value={newKey.keyName}
                onChange={(e) => setNewKey(prev => ({ ...prev, keyName: e.target.value }))}
                placeholder={t('form.keyNamePlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('form.apiKey')}</label>
              <Input
                type="password"
                value={newKey.apiKey}
                onChange={(e) => setNewKey(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder={t('form.apiKeyPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('form.region')}</label>
              <Input
                value={newKey.region || ''}
                onChange={(e) => setNewKey(prev => ({ ...prev, region: e.target.value }))}
                placeholder={t('form.regionPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('form.priority')}</label>
              <Input
                type="number"
                min={1}
                value={newKey.priority}
                onChange={(e) => setNewKey(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              {tCommon('buttons.cancel')}
            </Button>
            <Button onClick={handleCreateKey} disabled={isSubmitting}>
              {isSubmitting ? t('creating') : t('addKey')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {dialog}
    </div>
  );
}

// ==================== Course Type Config Tab ====================
function CourseTypeConfigTab() {
  const t = useTranslations('models.courseTypeConfig');
  const tCommon = useTranslations('common');
  const { confirm, dialog } = useConfirmDialog();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCourseType, setSelectedCourseType] = useState<string>('all');
  const [newConfig, setNewConfig] = useState<CourseTypeModelCreate>({
    courseType: 'MathLogic',
    aiModelId: 0,
    priority: 1,
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: courseTypeModels, loading } = useFetch<CourseTypeModel[]>(
    `/api/course-type-models/${selectedCourseType && selectedCourseType !== 'all' ? `?courseType=${selectedCourseType}` : ''}`
  );
  const { data: aiModels } = useFetch<AIModel[]>('/api/ai-models/');

  const models = courseTypeModels || [];
  const allAIModels = aiModels || [];
  const courseTypes = ['MathLogic', 'Programming', 'TheoryText'];

  const handleCreate = async () => {
    if (!newConfig.aiModelId) {
      toast.error(t('selectModelError'));
      return;
    }
    setIsSubmitting(true);
    try {
      await apiClient.createCourseTypeModel(newConfig);
      toast.success(t('createSuccess'));
      setIsCreateOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Failed to create course type model:', error);
      toast.error(t('createError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    confirm({
      title: t('deleteConfirm'),
      description: t('deleteConfirmDesc'),
      variant: 'destructive',
      confirmText: tCommon('buttons.delete'),
      cancelText: tCommon('buttons.cancel'),
      onConfirm: async () => {
        try {
          await apiClient.deleteCourseTypeModel(id);
          toast.success(t('deleteSuccess'));
          window.location.reload();
        } catch (error) {
          toast.error(t('deleteError'));
        }
      }
    });
  };

  const columns: TableColumn<CourseTypeModel>[] = [
    {
      key: 'courseType',
      label: t('columns.courseType'),
      sortable: true,
      render: (value) => (
        <Badge variant="outline">{value as string}</Badge>
      )
    },
    {
      key: 'aiModel',
      label: t('columns.model'),
      render: (_, item) => (
        <div>
          <div className="font-medium">{item.aiModel?.displayName || `Model #${item.aiModelId}`}</div>
          <div className="text-sm text-muted-foreground font-mono">{item.aiModel?.modelName}</div>
        </div>
      )
    },
    {
      key: 'priority',
      label: t('columns.priority'),
      sortable: true,
      render: (value) => <span className="font-mono">{value as number}</span>
    },
    {
      key: 'isActive',
      label: t('columns.status'),
      render: (_, item) => (
        <Badge variant={item.isActive ? 'default' : 'secondary'}>
          {item.isActive ? t('active') : t('inactive')}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: t('columns.actions'),
      width: '80px',
      render: (_, item) => (
        <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      )
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select value={selectedCourseType} onValueChange={setSelectedCourseType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t('filterAll')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filterAll')}</SelectItem>
            {courseTypes.map(ct => (
              <SelectItem key={ct} value={ct}>{ct}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('addConfig')}
        </Button>
      </div>

      <DataTable
        data={models}
        columns={columns}
        loading={loading}
        emptyMessage={t('emptyMessage')}
      />

      {/* Create Config Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('createTitle')}</DialogTitle>
            <DialogDescription>{t('createDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('form.courseType')}</label>
              <Select value={newConfig.courseType} onValueChange={(v) => setNewConfig(prev => ({ ...prev, courseType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {courseTypes.map(ct => (
                    <SelectItem key={ct} value={ct}>{ct}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('form.aiModel')}</label>
              <Select
                value={newConfig.aiModelId ? newConfig.aiModelId.toString() : ''}
                onValueChange={(v) => setNewConfig(prev => ({ ...prev, aiModelId: parseInt(v) }))}
              >
                <SelectTrigger><SelectValue placeholder={t('form.selectModel')} /></SelectTrigger>
                <SelectContent>
                  {allAIModels.filter(m => m.isActive).map(m => (
                    <SelectItem key={m.id} value={m.id.toString()}>
                      {m.displayName} ({m.provider})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('form.priority')}</label>
              <Input
                type="number"
                min={1}
                value={newConfig.priority}
                onChange={(e) => setNewConfig(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              {tCommon('buttons.cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? t('creating') : t('addConfig')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {dialog}
    </div>
  );
}

// ==================== University Overrides Tab ====================
function UniversityOverridesTab() {
  const t = useTranslations('models.universityOverrides');
  const [selectedUniversityId, setSelectedUniversityId] = useState<string>('');

  const { data: universities } = useFetch<{ items: { id: number; name: string }[] }>('/api/universities/?page=1&size=100');
  const { data: courseTypeModels, loading } = useFetch<CourseTypeModel[]>(
    selectedUniversityId
      ? `/api/course-type-models/university/${selectedUniversityId}`
      : null
  );

  const univList = universities?.items || [];
  const models = courseTypeModels || [];

  const columns: TableColumn<CourseTypeModel>[] = [
    {
      key: 'courseType',
      label: t('columns.courseType'),
      render: (value) => <Badge variant="outline">{value as string}</Badge>
    },
    {
      key: 'aiModel',
      label: t('columns.model'),
      render: (_, item) => (
        <div>
          <div className="font-medium">{item.aiModel?.displayName || `Model #${item.aiModelId}`}</div>
          <div className="text-sm text-muted-foreground font-mono">{item.aiModel?.modelName}</div>
        </div>
      )
    },
    {
      key: 'priority',
      label: t('columns.priority'),
      render: (value) => <span className="font-mono">{value as number}</span>
    },
    {
      key: 'isActive',
      label: t('columns.status'),
      render: (_, item) => (
        <Badge variant={item.isActive ? 'default' : 'secondary'}>
          {item.isActive ? t('active') : t('inactive')}
        </Badge>
      )
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <Select value={selectedUniversityId} onValueChange={setSelectedUniversityId}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder={t('selectUniversity')} />
          </SelectTrigger>
          <SelectContent>
            {univList.map(u => (
              <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedUniversityId ? (
        <DataTable
          data={models}
          columns={columns}
          loading={loading}
          emptyMessage={t('emptyMessage')}
        />
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>{t('selectUniversityPrompt')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ==================== Main Models Page ====================
export default function ModelsPage() {
  const t = useTranslations('models');

  const breadcrumbs: BreadcrumbItem[] = [
    { label: t('title'), isCurrentPage: true }
  ];

  return (
    <SuperAdminOnly>
      <div className="space-y-6">
        <PageHeader
          title={t('title')}
          description={t('description')}
          breadcrumbs={breadcrumbs}
        />

        <Tabs defaultValue="ai-models" className="space-y-4">
          <TabsList>
            <TabsTrigger value="ai-models">
              <Bot className="mr-2 h-4 w-4" />
              {t('tabs.aiModels')}
            </TabsTrigger>
            <TabsTrigger value="api-keys">
              <Key className="mr-2 h-4 w-4" />
              {t('tabs.apiKeys')}
            </TabsTrigger>
            <TabsTrigger value="course-type-config">
              <Settings2 className="mr-2 h-4 w-4" />
              {t('tabs.courseTypeConfig')}
            </TabsTrigger>
            <TabsTrigger value="university-overrides">
              <Building2 className="mr-2 h-4 w-4" />
              {t('tabs.universityOverrides')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai-models">
            <AIModelsTab />
          </TabsContent>

          <TabsContent value="api-keys">
            <APIKeysTab />
          </TabsContent>

          <TabsContent value="course-type-config">
            <CourseTypeConfigTab />
          </TabsContent>

          <TabsContent value="university-overrides">
            <UniversityOverridesTab />
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminOnly>
  );
}
