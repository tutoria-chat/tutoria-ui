'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Loader2, Copy, XCircle, Eye, EyeOff, Check, ChevronsUpDown } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { apiClient } from '@/lib/api';
import { formatDateShort, cn } from '@/lib/utils';
import type { Module, ModuleAccessToken, ModuleAccessTokenCreate, ModuleAccessTokenUpdate } from '@/lib/types';

export type TokenModalMode = 'create' | 'edit' | 'view';

interface TokenModalProps {
  mode: TokenModalMode;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token?: ModuleAccessToken;
  preselectedModuleId?: number;
}

export function TokenModal({ mode, open, onClose, onSuccess, token, preselectedModuleId }: TokenModalProps) {
  const { user } = useAuth();
  const t = useTranslations('tokens.modal');
  const tCommon = useTranslations('common');
  const [modules, setModules] = useState<Module[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [showFullToken, setShowFullToken] = useState(false);
  const [moduleComboboxOpen, setModuleComboboxOpen] = useState(false);
  const [moduleSearchQuery, setModuleSearchQuery] = useState('');
  const [originalFormData, setOriginalFormData] = useState<ModuleAccessTokenCreate>({
    name: '',
    description: '',
    module_id: preselectedModuleId || 0,
    allow_chat: true,
    allow_file_access: true,
    expires_in_days: undefined,
  });
  const [formData, setFormData] = useState<ModuleAccessTokenCreate>({
    name: '',
    description: '',
    module_id: preselectedModuleId || 0,
    allow_chat: true,
    allow_file_access: true,
    expires_in_days: undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Check if form has changes (only for edit mode)
  const hasChanges = () => {
    if (mode !== 'edit') return true; // Always allow submit for create mode
    return (
      formData.name !== originalFormData.name ||
      formData.description !== originalFormData.description ||
      formData.allow_chat !== originalFormData.allow_chat ||
      formData.allow_file_access !== originalFormData.allow_file_access
    );
  };

  // Load token data when editing or viewing
  useEffect(() => {
    if (token && (mode === 'edit' || mode === 'view')) {
      const initialData = {
        name: token.name,
        description: token.description || '',
        module_id: token.module_id,
        allow_chat: token.allow_chat,
        allow_file_access: token.allow_file_access,
        expires_in_days: undefined,
      };
      setFormData(initialData);
      setOriginalFormData(initialData);
    } else if (mode === 'create') {
      // Reset form for create mode
      const createData = {
        name: '',
        description: '',
        module_id: preselectedModuleId || 0,
        allow_chat: true,
        allow_file_access: true,
        expires_in_days: undefined,
      };
      setFormData(createData);
      setOriginalFormData(createData);
      setShowFullToken(false);
      setModuleSearchQuery('');
    }
  }, [token, mode, preselectedModuleId, open]);

  // Load modules for create mode with search
  useEffect(() => {
    if (mode === 'create' && open) {
      const loadModules = async () => {
        setLoadingModules(true);
        setErrors({});
        try {
          // If there's a preselected module, load only that module
          if (preselectedModuleId) {
            const preselectedModule = await apiClient.getModule(preselectedModuleId);
            setModules([preselectedModule]);
          } else {
            // Otherwise, load modules with search/filter
            const params: Record<string, string | number> = { page: 1, size: 100 };
            if (user?.university_id && user.role !== 'super_admin') {
              params.university_id = user.university_id;
            }
            if (moduleSearchQuery) {
              params.search = moduleSearchQuery;
            }
            const response = await apiClient.getModules(params);
            setModules(response.items);
          }
        } catch (error) {
          console.error('Failed to load modules:', error);
          // Set a flag that there was an error, actual message rendered in JSX with translation
          setErrors({ modules: 'ERROR' });
        } finally {
          setLoadingModules(false);
        }
      };

      // Only debounce if there's no preselected module and we have a search query
      if (preselectedModuleId) {
        loadModules();
      } else {
        const timeoutId = setTimeout(loadModules, moduleSearchQuery ? 300 : 0);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [mode, open, user, preselectedModuleId, moduleSearchQuery]);

  const handleChange = (field: keyof ModuleAccessTokenCreate, value: string | boolean | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = t('nameRequired');
    }

    if (mode === 'create' && (!formData.module_id || formData.module_id === 0)) {
      newErrors.module_id = t('moduleRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (mode === 'create') {
        await apiClient.createModuleToken(formData);
      } else if (mode === 'edit' && token) {
        const updateData: ModuleAccessTokenUpdate = {
          name: formData.name,
          description: formData.description,
          allow_chat: formData.allow_chat,
          allow_file_access: formData.allow_file_access,
        };
        await apiClient.updateModuleToken(token.id, updateData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(`Failed to ${mode} token:`, error);
      setErrors({ submit: mode === 'create' ? t('createError') : t('updateError') });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToken = async () => {
    if (!token?.token) return;
    try {
      await navigator.clipboard.writeText(token.token);
      toast.success(t('copySuccessShort'));
    } catch (error) {
      console.error('Error copying token:', error);
      toast.error(t('copyErrorShort'));
    }
  };

  const handleRevokeToken = async () => {
    if (!token) return;
    if (!confirm(t('revokeConfirm'))) {
      return;
    }
    try {
      await apiClient.updateModuleToken(token.id, { is_active: false });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error revoking token:', error);
      toast.error(t('revokeError'));
    }
  };

  const getDialogTitle = () => {
    switch (mode) {
      case 'create':
        return t('createTitle');
      case 'edit':
        return t('editTitle');
      case 'view':
        return t('viewTitle');
    }
  };

  const getDialogDescription = () => {
    switch (mode) {
      case 'create':
        return t('createDescription');
      case 'edit':
        return t('editDescription');
      case 'view':
        return t('viewDescription');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* View Mode - Token Details */}
          {mode === 'view' && token && (
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label>{t('tokenLabel')}</Label>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 text-xs bg-muted px-3 py-2 rounded font-mono break-all">
                        {showFullToken ? token.token : `${token.token.substring(0, 32)}...`}
                      </code>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFullToken(!showFullToken)}
                      >
                        {showFullToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyToken}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('name')}</Label>
                      <p className="text-sm">{token.name}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('status')}</Label>
                      <Badge variant={token.is_active ? "default" : "secondary"}>
                        {token.is_active ? t('active', { ns: 'tokens.columns' }) : t('inactive', { ns: 'tokens.columns' })}
                      </Badge>
                    </div>
                  </div>

                  {token.description && (
                    <div className="space-y-2">
                      <Label>{t('description')}</Label>
                      <p className="text-sm text-muted-foreground">{token.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('module')}</Label>
                      <p className="text-sm">{token.module_name}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('course')}</Label>
                      <p className="text-sm">{token.course_name}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('createdAt')}</Label>
                      <p className="text-sm">{formatDateShort(token.created_at)}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('expiresAt')}</Label>
                      <p className="text-sm">{token.expires_at ? formatDateShort(token.expires_at) : t('never', { ns: 'tokens.columns' })}</p>
                    </div>
                  </div>

                  {token.last_used_at && (
                    <div className="space-y-2">
                      <Label>{t('lastUsed')}</Label>
                      <p className="text-sm">{formatDateShort(token.last_used_at)}</p>
                    </div>
                  )}

                  {token.usage_count !== undefined && (
                    <div className="space-y-2">
                      <Label>{t('usageCount')}</Label>
                      <p className="text-sm">{t('requests', { count: token.usage_count })}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('chatPermission')}</Label>
                      <Badge variant={token.allow_chat ? "default" : "secondary"}>
                        {token.allow_chat ? t('allowed', { ns: 'tokens.columns' }) : t('blocked', { ns: 'tokens.columns' })}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('filePermission')}</Label>
                      <Badge variant={token.allow_file_access ? "default" : "secondary"}>
                        {token.allow_file_access ? t('allowed', { ns: 'tokens.columns' }) : t('blocked', { ns: 'tokens.columns' })}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyToken}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {t('copyToken')}
                </Button>
                {token.is_active && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRevokeToken}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {t('revokeToken')}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Create/Edit Mode - Form Fields */}
          {(mode === 'create' || mode === 'edit') && (
            <div className="space-y-4">
              {/* Module Selection (Create Only) */}
              {mode === 'create' && (
                <div className="space-y-2">
                  <Label htmlFor="module_id">{t('moduleLabel')}</Label>
                  {preselectedModuleId ? (
                    // Show selected module as read-only when preselected
                    <div className="w-full rounded-md border border-input bg-muted px-3 py-2">
                      <div className="flex flex-col">
                        <span className="text-sm">{modules.find((m) => m.id === formData.module_id)?.name || t('loadingModules')}</span>
                        <span className="text-xs text-muted-foreground">{modules.find((m) => m.id === formData.module_id)?.course_name}</span>
                      </div>
                    </div>
                  ) : (
                    // Show searchable dropdown when no preselection
                    <Popover open={moduleComboboxOpen} onOpenChange={setModuleComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={moduleComboboxOpen}
                          className="w-full justify-between"
                          disabled={isLoading || loadingModules}
                        >
                          {formData.module_id && formData.module_id !== 0
                            ? modules.find((m) => m.id === formData.module_id)?.name || t('selectModule')
                            : loadingModules ? t('loadingModules') : t('selectModule')}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder={t('searchModule')}
                            value={moduleSearchQuery}
                            onValueChange={setModuleSearchQuery}
                          />
                          <CommandList>
                            {loadingModules ? (
                              <div className="py-6 text-center text-sm">{t('loadingModules')}</div>
                            ) : modules.length === 0 ? (
                              <CommandEmpty>{t('noModules')}</CommandEmpty>
                            ) : (
                              <CommandGroup>
                                {modules.map((module) => (
                                  <CommandItem
                                    key={module.id}
                                    value={module.name}
                                    onSelect={() => {
                                      handleChange('module_id', module.id);
                                      setModuleComboboxOpen(false);
                                      setModuleSearchQuery('');
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        formData.module_id === module.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div className="flex flex-col">
                                      <span>{module.name}</span>
                                      <span className="text-xs text-muted-foreground">{module.course_name}</span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                  {errors.modules && (
                    <p className="text-sm text-destructive">{t('loadingModules')}</p>
                  )}
                  {errors.module_id && (
                    <p className="text-sm text-destructive">{errors.module_id}</p>
                  )}
                </div>
              )}

              {/* Module Display (Edit Only) */}
              {mode === 'edit' && token && (
                <div className="space-y-2">
                  <Label>{t('module')}</Label>
                  <p className="text-sm">{token.module_name} ({token.course_name})</p>
                </div>
              )}

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">{t('nameLabel')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder={t('namePlaceholder')}
                  disabled={isLoading}
                  required
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">{t('descriptionLabel')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder={t('descriptionPlaceholder')}
                  rows={3}
                  disabled={isLoading}
                />
              </div>

              {/* Expiration (Create Only) */}
              {mode === 'create' && (
                <div className="space-y-2">
                  <Label htmlFor="expires_in_days">{t('expiresLabel')}</Label>
                  <Input
                    id="expires_in_days"
                    type="number"
                    value={formData.expires_in_days || ''}
                    onChange={(e) => handleChange('expires_in_days', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder={t('expiresPlaceholder')}
                    disabled={isLoading}
                    min="1"
                  />
                  <p className="text-sm text-muted-foreground">
                    {t('expiresHint')}
                  </p>
                </div>
              )}

              {/* Permissions */}
              <div className="space-y-4">
                <Label>{t('permissions')}</Label>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="allow_chat">{t('allowChat')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('allowChatDesc')}
                    </p>
                  </div>
                  <Switch
                    id="allow_chat"
                    checked={formData.allow_chat}
                    onCheckedChange={(checked) => handleChange('allow_chat', checked)}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="allow_file_access">{t('allowFileAccess')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('allowFileAccessDesc')}
                    </p>
                  </div>
                  <Switch
                    id="allow_file_access"
                    checked={formData.allow_file_access}
                    onCheckedChange={(checked) => handleChange('allow_file_access', checked)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {errors.submit && (
                <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-md">
                  <p className="text-sm text-destructive">{errors.submit}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              {mode === 'view' ? t('close') : t('cancel')}
            </Button>
            {mode !== 'view' && (
              <Button type="submit" disabled={isLoading || !hasChanges()}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'create' ? t('createToken') : t('saveChanges')}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
