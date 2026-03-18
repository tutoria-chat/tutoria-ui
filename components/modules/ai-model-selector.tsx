'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';
import { AIModel } from '@/lib/types';
import { Check, Sparkles, Zap, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useAuth } from '@/components/auth/auth-provider';

// Maximum cost per 1M tokens that non-admin users can access (in USD)
const MAX_NON_ADMIN_MODEL_COST = 8;

interface AIModelSelectorProps {
  open: boolean;
  onClose: () => void;
  selectedModelId?: number;
  onSelectModel: (model: AIModel) => void;
}

export function AIModelSelector({ open, onClose, selectedModelId, onSelectModel }: AIModelSelectorProps) {
  const t = useTranslations('aiModels');
  const { user } = useAuth();
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);

  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    if (open) {
      loadModels();
    }
  }, [open]);

  const loadModels = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getAIModels({ is_active: true, include_deprecated: false });
      setModels(data);

      // Find and set the currently selected model
      if (selectedModelId) {
        const current = data.find(m => m.id === selectedModelId);
        if (current) {
          setSelectedModel(current);
        }
      }
    } catch (error) {
      console.error('Failed to load AI models:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectModel = (model: AIModel) => {
    setSelectedModel(model);
    onSelectModel(model);
    onClose();
  };

  const PROVIDER_CONFIG: Record<string, { label: string; logo: string | null }> = {
    openai: { label: 'OpenAI', logo: '/openai-logo.svg' },
    anthropic: { label: 'Anthropic Claude', logo: '/anthropic-logo.svg' },
    bedrock: { label: 'AWS Bedrock', logo: '/aws-logo.svg' },
    deepseek: { label: 'DeepSeek', logo: '/deepseek-logo.svg' },
    gemini: { label: 'Google Gemini', logo: '/gemini-logo.svg' },
    xai: { label: 'xAI Grok', logo: '/xai-logo.svg' },
  };

  const getModelTranslation = (modelName: string) => {
    const key = modelName.replace(/\./g, '-').replace(/_/g, '-');

    return {
      name: t(`models.${key}.name`),
      description: t(`models.${key}.description`),
      excellsAt: t(`models.${key}.excellsAt`)
    };
  };

  // Group models by provider dynamically
  const providerGroups = Object.entries(PROVIDER_CONFIG)
    .map(([provider, config]) => ({
      provider,
      ...config,
      models: models.filter(m => m.provider === provider),
    }))
    .filter(group => group.models.length > 0);

  const renderModelCard = (model: AIModel) => {
    const translation = getModelTranslation(model.modelName);
    const isSelected = selectedModel?.id === model.id;
    const isDeprecated = model.isDeprecated;
    const isExpensive = !isSuperAdmin && Number(model.inputCostPer1M) > MAX_NON_ADMIN_MODEL_COST;

    return (
      <button
        key={model.id}
        onClick={() => !isDeprecated && !isExpensive && handleSelectModel(model)}
        disabled={isDeprecated || isExpensive}
        className={cn(
          "relative p-6 rounded-lg border-2 text-left transition-all min-h-[200px]",
          "hover:border-primary hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed",
          isSelected ? "border-primary bg-primary/5 shadow-lg" : "border-border"
        )}
      >
        {isSelected && (
          <div className="absolute top-2 right-2">
            <Check className="h-5 w-5 text-primary" />
          </div>
        )}

        {isExpensive && (
          <Badge variant="default" className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            {t('comingSoon')}
          </Badge>
        )}

        {!isExpensive && isDeprecated && (
          <Badge variant="destructive" className="absolute top-2 right-2">
            {t('deprecated')}
          </Badge>
        )}

        {!isExpensive && !isDeprecated && model.requiredTier && (
          <Badge
            variant={model.requiredTier === 3 ? "default" : model.requiredTier === 2 ? "secondary" : "outline"}
            className="absolute top-2 right-2"
          >
            {model.requiredTier === 1 ? t('tierStarter') : model.requiredTier === 2 ? t('tierProfessional') : t('tierBusiness')}
          </Badge>
        )}

        <h4 className="font-bold text-lg mb-3 pr-20">{translation.name}</h4>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
          {translation.description}
        </p>

        <div className="flex items-center gap-2 text-xs text-primary mb-3">
          <Zap className="h-4 w-4" />
          <span className="line-clamp-2 leading-relaxed">{translation.excellsAt}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            {(Number(model.maxTokens) / 1000).toFixed(0)}K
          </div>
          {isSuperAdmin && model.inputCostPer1M && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              <span>${Number(model.inputCostPer1M).toFixed(2)} {t('pricePerMillion')}</span>
            </div>
          )}
        </div>
      </button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-[1800px] !w-[96vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-primary" />
            {t('selectModel')}
          </DialogTitle>
          <DialogDescription>
            {selectedModel ? (
              <span className="text-base">
                {t('currentModel')}: <span className="font-semibold text-foreground">{selectedModel.displayName}</span>
              </span>
            ) : (
              t('noModelSelected')
            )}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" className="text-primary" />
          </div>
        ) : (
          <div className="space-y-8">
            {providerGroups.map((group) => (
              <div key={group.provider}>
                <div className="flex items-center gap-3 mb-4">
                  {group.logo && (
                    <Image src={group.logo} alt={group.label} width={32} height={32} />
                  )}
                  <h3 className="text-lg font-semibold">{group.label}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {group.models.map(renderModelCard)}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
