'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Step {
  id: string;
  title: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  allowStepNavigation?: boolean;
}

export function Stepper({ steps, currentStep, onStepClick, allowStepNavigation = false }: StepperProps) {
  return (
    <div className="w-full px-4 py-2">
      <nav aria-label="Progress">
        <ol role="list" className="flex items-start justify-between gap-4">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isClickable = allowStepNavigation && index <= currentStep;

            return (
              <li
                key={step.id}
                className="relative flex flex-col items-center flex-1"
              >
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'absolute left-[calc(50%+20px)] right-[-50%] top-5 h-0.5',
                      isCompleted ? 'bg-primary' : 'bg-muted'
                    )}
                    aria-hidden="true"
                  />
                )}

                {/* Step Circle */}
                <button
                  type="button"
                  onClick={() => isClickable && onStepClick?.(index)}
                  disabled={!isClickable}
                  className={cn(
                    'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors shrink-0',
                    isCompleted && 'border-primary bg-primary text-primary-foreground',
                    isCurrent && 'border-primary bg-background text-primary',
                    !isCompleted && !isCurrent && 'border-muted bg-background text-muted-foreground',
                    isClickable && 'cursor-pointer hover:border-primary/50',
                    !isClickable && 'cursor-not-allowed'
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{stepNumber}</span>
                  )}
                </button>

                {/* Step Label */}
                <div className="mt-3 text-center w-full px-1">
                  <p
                    className={cn(
                      'text-sm font-medium break-words',
                      isCurrent && 'text-primary',
                      !isCurrent && 'text-muted-foreground'
                    )}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="mt-1 text-xs text-muted-foreground hidden sm:block break-words">
                      {step.description}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
