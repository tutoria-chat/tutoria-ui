'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';
import { AIModel } from '@/lib/types';
import { Check, Sparkles, Zap, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface AIModelSelectorProps {
  open: boolean;
  onClose: () => void;
  selectedModelId?: number;
  onSelectModel: (model: AIModel) => void;
}

export function AIModelSelector({ open, onClose, selectedModelId, onSelectModel }: AIModelSelectorProps) {
  const t = useTranslations('aiModels');
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);

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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {openaiModels.map((model) => {
                    const translation = getModelTranslation(model.model_name);
                    const isSelected = selectedModel?.id === model.id;
                    const isDeprecated = model.is_deprecated;

                    return (
                      <button
                        key={model.id}
                        onClick={() => !isDeprecated && handleSelectModel(model)}
                        disabled={isDeprecated}
                        className={cn(
                          "relative p-4 rounded-lg border-2 text-left transition-all",
                          "hover:border-primary hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed",
                          isSelected ? "border-primary bg-primary/5 shadow-lg" : "border-border"
                        )}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <Check className="h-5 w-5 text-primary" />
                          </div>
                        )}

                        {isDeprecated && (
                          <Badge variant="destructive" className="absolute top-2 right-2">
                            {t('deprecated')}
                          </Badge>
                        )}

                        {!isDeprecated && model.required_tier && (
                          <Badge
                            variant={model.required_tier === 3 ? "default" : model.required_tier === 2 ? "secondary" : "outline"}
                            className="absolute top-2 right-2"
                          >
                            {model.required_tier === 1 ? t('tierBasic') : model.required_tier === 2 ? t('tierStandard') : t('tierPremium')}
                          </Badge>
                        )}

                        <h4 className="font-bold text-base mb-2">{translation.name}</h4>

                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {translation.description}
                        </p>

                        <div className="flex items-center gap-1 text-xs text-primary mb-2">
                          <Zap className="h-3 w-3" />
                          <span className="line-clamp-1">{translation.excellsAt}</span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            {(model.max_tokens / 1000).toFixed(0)}K
                          </div>
                          {model.input_cost_per_1m && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ${model.input_cost_per_1m.toFixed(2)}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {anthropicModels.map((model) => {
                    const translation = getModelTranslation(model.model_name);
                    const isSelected = selectedModel?.id === model.id;
                    const isDeprecated = model.is_deprecated;

                    return (
                      <button
                        key={model.id}
                        onClick={() => !isDeprecated && handleSelectModel(model)}
                        disabled={isDeprecated}
                        className={cn(
                          "relative p-4 rounded-lg border-2 text-left transition-all",
                          "hover:border-primary hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed",
                          isSelected ? "border-primary bg-primary/5 shadow-lg" : "border-border"
                        )}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <Check className="h-5 w-5 text-primary" />
                          </div>
                        )}

                        {isDeprecated && (
                          <Badge variant="destructive" className="absolute top-2 right-2">
                            {t('deprecated')}
                          </Badge>
                        )}

                        {!isDeprecated && model.required_tier && (
                          <Badge
                            variant={model.required_tier === 3 ? "default" : model.required_tier === 2 ? "secondary" : "outline"}
                            className="absolute top-2 right-2"
                          >
                            {model.required_tier === 1 ? t('tierBasic') : model.required_tier === 2 ? t('tierStandard') : t('tierPremium')}
                          </Badge>
                        )}

                        <h4 className="font-bold text-base mb-2">{translation.name}</h4>

                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {translation.description}
                        </p>

                        <div className="flex items-center gap-1 text-xs text-primary mb-2">
                          <Zap className="h-3 w-3" />
                          <span className="line-clamp-1">{translation.excellsAt}</span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            {(model.max_tokens / 1000).toFixed(0)}K
                          </div>
                          {model.input_cost_per_1m && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ${model.input_cost_per_1m.toFixed(2)}
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
