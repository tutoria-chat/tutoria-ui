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

  const getProviderLogo = (provider: string) => {
    if (provider === 'openai') {
      return '/openai-logo.svg';
    } else if (provider === 'anthropic') {
      return '/anthropic-logo.svg';
    }
    return null;
  };

  const getModelTranslation = (modelName: string) => {
    // Map model_name to translation key (replace dots and dashes with underscores for key)
    const key = modelName.replace(/\./g, '-').replace(/_/g, '-');

    return {
      name: t(`models.${key}.name`),
      description: t(`models.${key}.description`),
      excellsAt: t(`models.${key}.excellsAt`)
    };
  };

  const openaiModels = models.filter(m => m.provider === 'openai');
  const anthropicModels = models.filter(m => m.provider === 'anthropic');

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
                {t('currentModel')}: <span className="font-semibold text-foreground">{selectedModel.display_name}</span>
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
            {/* OpenAI Models */}
            {openaiModels.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Image src="/openai-logo.svg" alt="OpenAI" width={32} height={32} />
                  <h3 className="text-lg font-semibold">OpenAI Models</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {openaiModels.map((model) => {
                    const translation = getModelTranslation(model.model_name);
                    const isSelected = selectedModel?.id === model.id;
                    const isDeprecated = model.is_deprecated;
                    const isExpensive = !isSuperAdmin && Number(model.input_cost_per_1m) > MAX_NON_ADMIN_MODEL_COST;

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

                        {!isExpensive && !isDeprecated && model.required_tier && (
                          <Badge
                            variant={model.required_tier === 3 ? "default" : model.required_tier === 2 ? "secondary" : "outline"}
                            className="absolute top-2 right-2"
                          >
                            {model.required_tier === 1 ? t('tierBasic') : model.required_tier === 2 ? t('tierStandard') : t('tierPremium')}
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
                            {(Number(model.max_tokens) / 1000).toFixed(0)}K
                          </div>
                          {isSuperAdmin && model.input_cost_per_1m && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              <span>${Number(model.input_cost_per_1m).toFixed(2)} {t('pricePerMillion')}</span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Anthropic Models */}
            {anthropicModels.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Image src="/anthropic-logo.svg" alt="Anthropic" width={32} height={32} />
                  <h3 className="text-lg font-semibold">Anthropic Claude Models</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {anthropicModels.map((model) => {
                    const translation = getModelTranslation(model.model_name);
                    const isSelected = selectedModel?.id === model.id;
                    const isDeprecated = model.is_deprecated;
                    const isExpensive = !isSuperAdmin && Number(model.input_cost_per_1m) > MAX_NON_ADMIN_MODEL_COST;

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

                        {!isExpensive && !isDeprecated && model.required_tier && (
                          <Badge
                            variant={model.required_tier === 3 ? "default" : model.required_tier === 2 ? "secondary" : "outline"}
                            className="absolute top-2 right-2"
                          >
                            {model.required_tier === 1 ? t('tierBasic') : model.required_tier === 2 ? t('tierStandard') : t('tierPremium')}
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
                            {(Number(model.max_tokens) / 1000).toFixed(0)}K
                          </div>
                          {isSuperAdmin && model.input_cost_per_1m && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              <span>${Number(model.input_cost_per_1m).toFixed(2)} {t('pricePerMillion')}</span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
