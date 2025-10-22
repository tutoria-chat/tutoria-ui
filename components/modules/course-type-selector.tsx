'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';
import { AIModel } from '@/lib/types';
import { Check, Calculator, Code, BookText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/auth-provider';
import { COURSE_TYPE_MODEL_PREFERENCES, type CourseType } from '@/lib/course-type-utils';

// Re-export CourseType for backward compatibility
export type { CourseType } from '@/lib/course-type-utils';

interface CourseTypeOption {
  id: CourseType;
  icon: React.ReactNode;
  name: string;
  description: string;
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

  // Course type options (model preferences now centralized in course-type-utils.ts)
  const courseTypes: CourseTypeOption[] = [
    {
      id: 'math-logic',
      icon: <Calculator className="h-8 w-8" />,
      name: t('mathLogic.name') || 'Mathematics & Logic',
      description: t('mathLogic.description') || 'Courses focused on mathematical reasoning, formulas, proofs, and logical problem-solving',
    },
    {
      id: 'programming',
      icon: <Code className="h-8 w-8" />,
      name: t('programming.name') || 'Programming & Computer Science',
      description: t('programming.description') || 'Coding, algorithms, software development, and technical computer science topics',
    },
    {
      id: 'theory-text',
      icon: <BookText className="h-8 w-8" />,
      name: t('theoryText.name') || 'Theory & Humanities',
      description: t('theoryText.description') || 'Theoretical concepts, essays, humanities, literature, and text-heavy subjects',
    }
  ];

  const loadUniversityTier = useCallback(async () => {
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
  }, [universityId]);

  const loadModels = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.getAIModels({ is_active: true, include_deprecated: false });
      setModels(data);
    } catch (error) {
      console.error('Failed to load AI models:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadModels();
      if (universityId) {
        loadUniversityTier();
      }
    }
  }, [open, universityId, loadModels, loadUniversityTier]);

  const handleSelectType = (type: CourseType) => {
    // Get the appropriate model name based on university tier
    const targetModelName = COURSE_TYPE_MODEL_PREFERENCES[type][universityTier];

    // Find the model in the loaded models
    const matchedModel = models.find(m => m.modelName === targetModelName);

    if (matchedModel) {
      setSelected(type);
      onSelectType(type, matchedModel);
      onClose();
    } else {
      console.error(`Model "${targetModelName}" not found in database`);
      // Fallback: try to find ANY available model for this type
      const fallbackModel = findFallbackModel(type);
      if (fallbackModel) {
        setSelected(type);
        onSelectType(type, fallbackModel);
        onClose();
      }
    }
  };

  // Fallback: find a suitable model if the preferred one isn't available
  // Respects university tier - won't select premium models for basic tier universities
  const findFallbackModel = (courseType: CourseType): AIModel | null => {
    const modelPreferences = COURSE_TYPE_MODEL_PREFERENCES[courseType];

    // Build tier preferences based on university tier
    let preferences: string[];

    if (universityTier === 'basic') {
      // Basic tier: only try basic models
      preferences = [modelPreferences.basic];
    } else if (universityTier === 'standard') {
      // Standard tier: try standard, then basic
      preferences = [
        modelPreferences.standard,
        modelPreferences.basic,
      ];
    } else {
      // Premium tier: try all in descending order
      preferences = [
        modelPreferences.premium,
        modelPreferences.standard,
        modelPreferences.basic,
      ];
    }

    // Try to find model from allowed tier preferences
    for (const modelName of preferences) {
      const model = models.find(m => m.modelName === modelName);
      if (model) return model;
    }

    // Ultimate fallback: return first available model
    // This should rarely happen if AI models are properly seeded
    return models[0] || null;
  };

  const getSelectedModelForType = (type: CourseType): string => {
    const targetModelName = COURSE_TYPE_MODEL_PREFERENCES[type][universityTier];
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
