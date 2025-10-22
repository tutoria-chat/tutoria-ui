'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';
import { AIModel } from '@/lib/types';
import { Check, Calculator, Code, BookText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/auth-provider';

// Course types with their optimal AI models
export type CourseType = 'math-logic' | 'programming' | 'theory-text';

interface CourseTypeOption {
  id: CourseType;
  icon: React.ReactNode;
  name: string;
  description: string;
  // Model preferences by tier (1 = basic, 2 = standard, 3 = premium)
  modelPreferences: {
    basic: string;     // Cheaper models for basic tier
    standard: string;  // Mid-tier models
    premium: string;   // Best performance models
  };
}

interface CourseTypeSelectorProps {
  open: boolean;
  onClose: () => void;
  selectedType?: CourseType;
  onSelectType: (type: CourseType, model: AIModel) => void;
  universityId?: number;
}

export function CourseTypeSelector({ open, onClose, selectedType, onSelectType, universityId }: CourseTypeSelectorProps) {
  const t = useTranslations('courseTypes');
  const { user } = useAuth();
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CourseType | undefined>(selectedType);
  const [universityTier, setUniversityTier] = useState<'basic' | 'standard' | 'premium'>('basic');

  // Course type options with model preferences
  const courseTypes: CourseTypeOption[] = [
    {
      id: 'math-logic',
      icon: <Calculator className="h-8 w-8" />,
      name: t('mathLogic.name') || 'Mathematics & Logic',
      description: t('mathLogic.description') || 'Courses focused on mathematical reasoning, formulas, proofs, and logical problem-solving',
      modelPreferences: {
        basic: 'gpt-3.5-turbo',         // Cheap and reliable for math
        standard: 'gpt-4',               // Better reasoning
        premium: 'gpt-4o',               // Best math performance
      }
    },
    {
      id: 'programming',
      icon: <Code className="h-8 w-8" />,
      name: t('programming.name') || 'Programming & Computer Science',
      description: t('programming.description') || 'Coding, algorithms, software development, and technical computer science topics',
      modelPreferences: {
        basic: 'claude-3-haiku-20240307',    // Fast and good for code
        standard: 'claude-3-7-sonnet-20250219', // Better coding assistance
        premium: 'claude-sonnet-4-5',         // Best coding model
      }
    },
    {
      id: 'theory-text',
      icon: <BookText className="h-8 w-8" />,
      name: t('theoryText.name') || 'Theory & Humanities',
      description: t('theoryText.description') || 'Theoretical concepts, essays, humanities, literature, and text-heavy subjects',
      modelPreferences: {
        basic: 'claude-3-haiku-20240307',     // Fast and cost-effective
        standard: 'claude-3-5-haiku-20241022', // Better comprehension
        premium: 'claude-haiku-4-5',           // Best quality
      }
    }
  ];

  useEffect(() => {
    if (open) {
      loadModels();
      if (universityId) {
        loadUniversityTier();
      }
    }
  }, [open, universityId]);

  const loadUniversityTier = async () => {
    if (!universityId) return;

    try {
      const university = await apiClient.getUniversity(universityId);
      // Map subscription tier number to tier string
      let tier: 'basic' | 'standard' | 'premium' = 'basic';
      if (university.subscriptionTier === 3) {
        tier = 'premium';
      } else if (university.subscriptionTier === 2) {
        tier = 'standard';
      }
      setUniversityTier(tier);
    } catch (error) {
      console.error('Failed to load university tier:', error);
      // Default to basic if fetch fails
      setUniversityTier('basic');
    }
  };

  const loadModels = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getAIModels({ is_active: true, include_deprecated: false });
      setModels(data);
    } catch (error) {
      console.error('Failed to load AI models:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectType = (type: CourseType) => {
    const courseType = courseTypes.find(ct => ct.id === type);
    if (!courseType) return;

    // Get the appropriate model name based on university tier
    const targetModelName = courseType.modelPreferences[universityTier];

    // Find the model in the loaded models
    const matchedModel = models.find(m => m.modelName === targetModelName);

    if (matchedModel) {
      setSelected(type);
      onSelectType(type, matchedModel);
      onClose();
    } else {
      console.error(`Model "${targetModelName}" not found in database`);
      // Fallback: try to find ANY available model for this type
      const fallbackModel = findFallbackModel(courseType);
      if (fallbackModel) {
        setSelected(type);
        onSelectType(type, fallbackModel);
        onClose();
      }
    }
  };

  // Fallback: find a suitable model if the preferred one isn't available
  const findFallbackModel = (courseType: CourseTypeOption): AIModel | null => {
    // Try all tier preferences in order
    const preferences = [
      courseType.modelPreferences.basic,
      courseType.modelPreferences.standard,
      courseType.modelPreferences.premium,
    ];

    for (const modelName of preferences) {
      const model = models.find(m => m.modelName === modelName);
      if (model) return model;
    }

    // Ultimate fallback: return first available model
    return models[0] || null;
  };

  const getSelectedModelForType = (type: CourseType): string => {
    const courseType = courseTypes.find(ct => ct.id === type);
    if (!courseType) return '';

    const targetModelName = courseType.modelPreferences[universityTier];
    const model = models.find(m => m.modelName === targetModelName);

    return model ? model.displayName : targetModelName;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-[1200px] !w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {t('selectCourseType') || 'Select Course Type'}
          </DialogTitle>
          <DialogDescription>
            {t('selectDescription') || 'Choose the type that best matches your course content. We\'ll automatically select the optimal AI model.'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" className="text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            {courseTypes.map((courseType) => {
              const isSelected = selected === courseType.id;
              const selectedModel = getSelectedModelForType(courseType.id);

              return (
                <button
                  key={courseType.id}
                  onClick={() => handleSelectType(courseType.id)}
                  className={cn(
                    "relative p-6 rounded-lg border-2 text-left transition-all min-h-[280px] flex flex-col",
                    "hover:border-primary hover:shadow-lg",
                    isSelected ? "border-primary bg-primary/5 shadow-lg" : "border-border"
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                  )}

                  <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-primary/10 text-primary mb-4">
                    {courseType.icon}
                  </div>

                  <h4 className="font-bold text-lg mb-2">{courseType.name}</h4>

                  <p className="text-sm text-muted-foreground mb-4 flex-grow leading-relaxed">
                    {courseType.description}
                  </p>

                  <div className="mt-auto pt-4 border-t border-border">
                    <div className="text-xs text-muted-foreground mb-1">
                      {t('selectedModel') || 'AI Model:'}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {selectedModel}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>{t('tierNote') || 'Note:'}:</strong> {' '}
            {t('tierDescription') || 'The AI model is automatically optimized based on your university\'s subscription tier for best cost-performance balance.'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
