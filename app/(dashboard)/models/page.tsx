'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bot, Key, Settings2, Building2, Plus, Edit, Trash2, Power, PowerOff, FileText, Sparkles, BarChart3 } from 'lucide-react';
import Image from 'next/image';

const PROVIDER_LOGOS: Record<string, { src: string; alt: string }> = {
  openai: { src: '/providers/openai.png', alt: 'OpenAI' },
  anthropic: { src: '/providers/anthropic.svg', alt: 'Anthropic' },
  bedrock: { src: '/providers/bedrock.png', alt: 'AWS Bedrock' },
  deepseek: { src: '/providers/deepseek.png', alt: 'DeepSeek' },
  gemini: { src: '/providers/gemini.png', alt: 'Google Gemini' },
  xai: { src: '/providers/xai.png', alt: 'xAI' },
};

function ProviderLogo({ provider, size = 20 }: { provider: string; size?: number }) {
  const logo = PROVIDER_LOGOS[provider?.toLowerCase()];
  if (logo) {
    return <Image src={logo.src} alt={logo.alt} width={size} height={size} className="object-contain" />;
  }
  return <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
}
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { SuperAdminOnly } from '@/components/auth/role-guard';
import { useFetch } from '@/lib/hooks';
import { apiClient } from '@/lib/api';
import { formatDateShort } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import type {
  AIModel,
  AIModelCreate,
  AIProvider,
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
const EMPTY_AI_MODEL: AIModelCreate = {
  modelName: '',
  displayName: '',
  provider: 'openai',
  maxTokens: 4096,
  supportsVision: false,
  supportsFunctionCalling: false,
  useForFileExtraction: false,
  useForFormatting: false,
  useForTopicClassification: false,
  inputCostPer1M: 0,
  outputCostPer1M: 0,
  requiredTier: 3,
  isActive: true,
  isDeprecated: false,
  description: '',
  recommendedFor: '',
};

function AIModelsTab() {
  const t = useTranslations('models.aiModels');
  const tCommon = useTranslations('common');
  const [searchTerm, setSearchTerm] = useState('');
  const { confirm, dialog } = useConfirmDialog();

  const [allModels, setAllModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);
  const [formData, setFormData] = useState<AIModelCreate>(EMPTY_AI_MODEL);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadModels = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.getAIModels({ include_deprecated: true });
      setAllModels(data);
    } catch (error) {
      console.error('Failed to load AI models:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { loadModels(); }, [loadModels]);

  const filtered = allModels.filter(m =>
    m.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.modelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.provider?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreate = () => {
    setEditingModel(null);
    setFormData(EMPTY_AI_MODEL);
    setIsDialogOpen(true);
  };

  const openEdit = (model: AIModel) => {
    setEditingModel(model);
    setFormData({
      modelName: model.modelName,
      displayName: model.displayName,
      provider: model.provider,
      maxTokens: model.maxTokens,
      supportsVision: model.supportsVision,
      supportsFunctionCalling: model.supportsFunctionCalling,
      useForFileExtraction: model.useForFileExtraction,
      useForFormatting: model.useForFormatting,
      useForTopicClassification: model.useForTopicClassification,
      inputCostPer1M: model.inputCostPer1M ?? 0,
      outputCostPer1M: model.outputCostPer1M ?? 0,
      requiredTier: model.requiredTier,
      isActive: model.isActive,
      isDeprecated: model.isDeprecated,
      deprecationDate: model.deprecationDate,
      description: model.description || '',
      recommendedFor: model.recommendedFor || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.modelName.trim() || !formData.displayName.trim()) {
      toast.error(t('validationError'));
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingModel) {
        await apiClient.updateAIModel(editingModel.id, formData);
        toast.success(t('updateSuccess'));
      } else {
        await apiClient.createAIModel(formData);
        toast.success(t('createSuccess'));
      }
      setIsDialogOpen(false);
      loadModels();
    } catch (error) {
      console.error('Failed to save AI model:', error);
      toast.error(editingModel ? t('updateError') : t('createError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (model: AIModel) => {
    try {
      await apiClient.updateAIModel(model.id, { isActive: !model.isActive });
      toast.success(model.isActive ? t('deactivateSuccess') : t('activateSuccess'));
      loadModels();
    } catch (error) {
      console.error('Failed to toggle AI model status:', error);
      toast.error(t('updateError'));
    }
  };

  const handleDelete = (model: AIModel) => {
    confirm({
      title: t('deleteConfirm'),
      description: t('deleteConfirmDesc', { name: model.displayName }),
      variant: 'destructive',
      confirmText: tCommon('buttons.delete'),
      cancelText: tCommon('buttons.cancel'),
      onConfirm: async () => {
        try {
          await apiClient.deleteAIModel(model.id);
          toast.success(t('deleteSuccess'));
          loadModels();
        } catch (error) {
          console.error('Failed to delete AI model:', error);
          toast.error(t('deleteError'));
        }
      },
    });
  };

  const updateField = <K extends keyof AIModelCreate>(field: K, value: AIModelCreate[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const columns: TableColumn<AIModel>[] = [
    {
      key: 'displayName',
      label: t('columns.name'),
      sortable: true,
      render: (_, model) => (
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center">
            <ProviderLogo provider={model.provider} />
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
      render: (_, model) => (
        <div className="flex items-center gap-2">
          <ProviderLogo provider={model.provider} size={16} />
          <Badge variant="outline" className="capitalize">{model.provider}</Badge>
        </div>
      )
    },
    {
      key: 'isActive',
      label: t('columns.status'),
      render: (_, model) => (
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={model.isActive ? 'default' : 'secondary'}>
            {model.isActive ? t('active') : t('inactive')}
          </Badge>
          {model.isDeprecated && (
            <Badge variant="destructive">{t('deprecated')}</Badge>
          )}
          {model.useForFileExtraction && (
            <Badge variant="outline" className="text-blue-600 border-blue-300 dark:text-blue-400 dark:border-blue-700">
              <FileText className="h-3 w-3 mr-1" />
              {t('fileProcessing')}
            </Badge>
          )}
          {model.useForFormatting && (
            <Badge variant="outline" className="text-purple-600 border-purple-300 dark:text-purple-400 dark:border-purple-700">
              <Sparkles className="h-3 w-3 mr-1" />
              {t('formatting')}
            </Badge>
          )}
          {model.useForTopicClassification && (
            <Badge variant="outline" className="text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700">
              <BarChart3 className="h-3 w-3 mr-1" />
              {t('topicClassification')}
            </Badge>
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
        const tierLabels: Record<number, string> = { 1: 'Starter', 2: 'Professional', 3: 'Business' };
        return <Badge variant="outline">{tierLabels[tier] || `Tier ${tier}`}</Badge>;
      }
    },
    {
      key: 'actions',
      label: tCommon('buttons.actions'),
      width: '150px',
      render: (_, model) => (
        <div className="flex items-center gap-1">
          <Switch
            checked={model.isActive}
            onCheckedChange={() => handleToggleActive(model)}
            className="scale-75"
          />
          <Button variant="ghost" size="sm" onClick={() => openEdit(model)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(model)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('addModel')}
        </Button>
      </div>

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

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingModel ? t('editTitle') : t('createTitle')}</DialogTitle>
            <DialogDescription>{editingModel ? t('editDescription') : t('createDescription')}</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('form.modelName')}</label>
              <Input
                value={formData.modelName}
                onChange={(e) => updateField('modelName', e.target.value)}
                placeholder="gpt-4o"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('form.displayName')}</label>
              <Input
                value={formData.displayName}
                onChange={(e) => updateField('displayName', e.target.value)}
                placeholder="GPT-4o"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('form.provider')}</label>
              <Select value={formData.provider} onValueChange={(v) => updateField('provider', v as AIProvider)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="bedrock">AWS Bedrock</SelectItem>
                  <SelectItem value="deepseek">DeepSeek</SelectItem>
                  <SelectItem value="gemini">Google Gemini</SelectItem>
                  <SelectItem value="xai">xAI (Grok)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('form.maxTokens')}</label>
              <Input
                type="number"
                min="1"
                value={formData.maxTokens}
                onChange={(e) => updateField('maxTokens', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('columns.inputCost')} ($)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.inputCostPer1M ?? 0}
                onChange={(e) => updateField('inputCostPer1M', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('columns.outputCost')} ($)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.outputCostPer1M ?? 0}
                onChange={(e) => updateField('outputCostPer1M', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('columns.tier')}</label>
              <Select value={formData.requiredTier.toString()} onValueChange={(v) => updateField('requiredTier', parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Starter</SelectItem>
                  <SelectItem value="2">2 - Professional</SelectItem>
                  <SelectItem value="3">3 - Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">{t('form.description')}</label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                rows={2}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">{t('form.recommendedFor')}</label>
              <Input
                value={formData.recommendedFor || ''}
                onChange={(e) => updateField('recommendedFor', e.target.value)}
              />
            </div>
            <div className="col-span-2 grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm font-medium">{t('form.supportsVision')}</span>
                <Switch checked={formData.supportsVision} onCheckedChange={(v) => updateField('supportsVision', v)} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm font-medium">{t('form.supportsFunctions')}</span>
                <Switch checked={formData.supportsFunctionCalling} onCheckedChange={(v) => updateField('supportsFunctionCalling', v)} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">{t('form.useForFileProcessing')}</span>
                </div>
                <Switch checked={formData.useForFileExtraction} onCheckedChange={(v) => updateField('useForFileExtraction', v)} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">{t('form.useForFormatting')}</span>
                </div>
                <Switch checked={formData.useForFormatting} onCheckedChange={(v) => updateField('useForFormatting', v)} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">{t('form.useForTopicClassification')}</span>
                </div>
                <Switch checked={formData.useForTopicClassification} onCheckedChange={(v) => updateField('useForTopicClassification', v)} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm font-medium">{t('active')}</span>
                <Switch checked={formData.isActive} onCheckedChange={(v) => updateField('isActive', v)} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm font-medium">{t('deprecated')}</span>
                <Switch checked={formData.isDeprecated} onCheckedChange={(v) => updateField('isDeprecated', v)} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {tCommon('buttons.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? t('saving') : editingModel ? tCommon('buttons.save') : t('addModel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
  const [awsAccessKeyId, setAwsAccessKeyId] = useState('');
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { confirm, dialog } = useConfirmDialog();

  const { data: providerKeys, loading } = useFetch<ProviderKey[]>('/api/provider-keys/');

  const keys = providerKeys || [];
  const filtered = keys.filter(k =>
    k.keyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.provider?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateKey = async () => {
    const isBedrock = newKey.provider === 'bedrock';
    if (!newKey.keyName.trim()) {
      toast.error(t('validationError'));
      return;
    }
    if (isBedrock) {
      if (!awsAccessKeyId.trim() || !awsSecretAccessKey.trim()) {
        toast.error(t('awsCredsRequired'));
        return;
      }
    } else if (!newKey.apiKey.trim()) {
      toast.error(t('validationError'));
      return;
    }

    const payload = { ...newKey };
    if (isBedrock) {
      payload.apiKey = JSON.stringify({ accessKeyId: awsAccessKeyId, secretAccessKey: awsSecretAccessKey });
    }

    setIsSubmitting(true);
    try {
      await apiClient.createProviderKey(payload);
      toast.success(t('createSuccess'));
      setIsCreateOpen(false);
      setNewKey({ provider: 'openai', keyName: '', apiKey: '', region: '', priority: 1, isActive: true });
      setAwsAccessKeyId('');
      setAwsSecretAccessKey('');
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
      render: (_, key) => (
        <div className="flex items-center gap-2">
          <ProviderLogo provider={key.provider} size={16} />
          <Badge variant="outline" className="capitalize">{key.provider}</Badge>
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
                  <SelectItem value="bedrock">AWS Bedrock</SelectItem>
                  <SelectItem value="deepseek">DeepSeek</SelectItem>
                  <SelectItem value="gemini">Google Gemini</SelectItem>
                  <SelectItem value="xai">xAI (Grok)</SelectItem>
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
            {newKey.provider === 'bedrock' ? (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('form.awsAccessKeyId')}</label>
                  <Input
                    type="password"
                    value={awsAccessKeyId}
                    onChange={(e) => setAwsAccessKeyId(e.target.value)}
                    placeholder="AKIA..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('form.awsSecretAccessKey')}</label>
                  <Input
                    type="password"
                    value={awsSecretAccessKey}
                    onChange={(e) => setAwsSecretAccessKey(e.target.value)}
                    placeholder="wJalr..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('form.region')}</label>
                  <Input
                    value={newKey.region || ''}
                    onChange={(e) => setNewKey(prev => ({ ...prev, region: e.target.value }))}
                    placeholder="us-east-2"
                  />
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
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
  const tCourseTypes = useTranslations('courseTypes');
  const { confirm, dialog } = useConfirmDialog();

  const getCourseTypeLabel = (enumValue: string): string => {
    const keyMap: Record<string, string> = {
      'MathLogic': 'mathLogic',
      'Programming': 'programming',
      'TheoryText': 'theoryText',
    };
    const key = keyMap[enumValue];
    return key ? tCourseTypes(`${key}.name`) : enumValue;
  };
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
        <Badge variant="outline">{getCourseTypeLabel(value as string)}</Badge>
      )
    },
    {
      key: 'aiModel',
      label: t('columns.model'),
      render: (_, item) => (
        <div>
          <div className="font-medium">{item.aiModelDisplayName || item.aiModel?.displayName || `Model #${item.aiModelId}`}</div>
          <div className="text-sm text-muted-foreground font-mono">{item.aiModelName || item.aiModel?.modelName}</div>
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
              <SelectItem key={ct} value={ct}>{getCourseTypeLabel(ct)}</SelectItem>
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
                    <SelectItem key={ct} value={ct}>{getCourseTypeLabel(ct)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('form.aiModel')}</label>
              <Combobox
                options={allAIModels.filter(m => m.isActive).map(m => ({
                  value: m.id.toString(),
                  label: `${m.displayName} (${m.provider})`,
                }))}
                value={newConfig.aiModelId ? newConfig.aiModelId.toString() : ''}
                onValueChange={(v) => setNewConfig(prev => ({ ...prev, aiModelId: parseInt(v) || 0 }))}
                placeholder={t('form.selectModel')}
                searchPlaceholder={t('form.searchModel') ?? undefined}
              />
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
  const tCourseTypes = useTranslations('courseTypes');
  const [selectedUniversityId, setSelectedUniversityId] = useState<string>('');

  const getCourseTypeLabel = (enumValue: string): string => {
    const keyMap: Record<string, string> = {
      'MathLogic': 'mathLogic',
      'Programming': 'programming',
      'TheoryText': 'theoryText',
    };
    const key = keyMap[enumValue];
    return key ? tCourseTypes(`${key}.name`) : enumValue;
  };

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
      render: (value) => <Badge variant="outline">{getCourseTypeLabel(value as string)}</Badge>
    },
    {
      key: 'aiModel',
      label: t('columns.model'),
      render: (_, item) => (
        <div>
          <div className="font-medium">{item.aiModelDisplayName || item.aiModel?.displayName || `Model #${item.aiModelId}`}</div>
          <div className="text-sm text-muted-foreground font-mono">{item.aiModelName || item.aiModel?.modelName}</div>
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
      <div className="w-[300px]">
        <Combobox
          options={univList.map(u => ({
            value: u.id.toString(),
            label: u.name,
          }))}
          value={selectedUniversityId}
          onValueChange={setSelectedUniversityId}
          placeholder={t('selectUniversity')}
          searchPlaceholder={t('searchUniversity') ?? undefined}
        />
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
