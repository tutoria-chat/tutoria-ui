'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslations } from 'next-intl';
import { type CourseType } from '@/lib/course-type-utils';
import { Check, Calculator, Code, BookText } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  onSelectType: (type: CourseType) => void; // Simplified: only returns courseType (backend selects model)
  universityId?: number; // Kept for future use, but not currently needed
}

export function CourseTypeSelector({ open, onClose, selectedType, onSelectType }: CourseTypeSelectorProps) {
  const t = useTranslations('courseTypes');
  const [selected, setSelected] = useState<CourseType | undefined>(selectedType);

  // Course type options (backend now handles AI model selection based on university tier)
  const courseTypes: CourseTypeOption[] = [
    {
      id: 'MathLogic',
      icon: <Calculator />,
      name: t('mathLogic.name') || 'Mathematics & Logic',
      description: t('mathLogic.description') || 'Courses focused on mathematical reasoning, formulas, proofs, and logical problem-solving',
    },
    {
      id: 'Programming',
      icon: <Code />,
      name: t('programming.name') || 'Programming & Computer Science',
      description: t('programming.description') || 'Coding, algorithms, software development, and technical computer science topics',
    },
    {
      id: 'TheoryText',
      icon: <BookText />,
      name: t('theoryText.name') || 'Theory & Humanities',
      description: t('theoryText.description') || 'Theoretical concepts, essays, humanities, literature, and text-heavy subjects',
    }
  ];

  const handleSelectType = (type: CourseType) => {
    setSelected(type);
    onSelectType(type); // Simplified: only pass course type, backend selects model
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('selectCourseType') || 'Select Course Type'}</DialogTitle>
          <DialogDescription>
            {t('selectDescription') || 'Choose the type that best matches your course content. We\'ll automatically select the optimal AI model.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          {courseTypes.map((courseType) => {
            const isSelected = selected === courseType.id;

            return (
              <button
                key={courseType.id}
                onClick={() => handleSelectType(courseType.id)}
                className={cn(
                  "relative p-4 rounded-lg border-2 text-left transition-all flex flex-col",
                  "hover:border-primary hover:shadow-md",
                  isSelected ? "border-primary bg-primary/5 shadow-md" : "border-border"
                )}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                )}

                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary mb-3">
                  {React.cloneElement(courseType.icon as React.ReactElement, { className: 'h-5 w-5' })}
                </div>

                <h4 className="font-semibold text-sm mb-1">{courseType.name}</h4>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {courseType.description}
                </p>
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          <strong>{t('tierNote') || 'Note:'}:</strong>{' '}
          {t('tierDescription') || 'The AI model is automatically optimized based on your university\'s subscription tier for best cost-performance balance.'}
        </p>
      </DialogContent>
    </Dialog>
  );
}
