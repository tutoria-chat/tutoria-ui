/**
 * Course Type Utilities
 *
 * Centralized logic for course type detection and AI model preferences.
 * This ensures consistency across CourseTypeSelector and edit pages.
 */

export type CourseType = 'math-logic' | 'programming' | 'theory-text';

export interface ModelPreferences {
  basic: string;
  standard: string;
  premium: string;
}

/**
 * AI model preferences for each course type by subscription tier.
 *
 * This is the single source of truth for course type -> model mappings.
 */
export const COURSE_TYPE_MODEL_PREFERENCES: Record<CourseType, ModelPreferences> = {
  'math-logic': {
    basic: 'gpt-3.5-turbo',         // Cheap and reliable for math
    standard: 'gpt-4',               // Better reasoning
    premium: 'gpt-4o',               // Best math performance
  },
  'programming': {
    basic: 'claude-3-haiku-20240307',    // Fast and good for code
    standard: 'claude-3-7-sonnet-20250219', // Better coding assistance
    premium: 'claude-sonnet-4-5',         // Best coding model
  },
  'theory-text': {
    basic: 'claude-3-haiku-20240307',     // Fast and cost-effective
    standard: 'claude-3-5-haiku-20241022', // Better comprehension
    premium: 'claude-haiku-4-5',           // Best quality
  },
};

/**
 * Detect course type from AI model name.
 *
 * @param modelName - The AI model name (e.g., 'gpt-4o', 'claude-sonnet-4-5')
 * @returns The detected course type, or undefined if no match
 */
export function detectCourseType(modelName: string): CourseType | undefined {
  // Check each course type's model preferences
  for (const [courseType, preferences] of Object.entries(COURSE_TYPE_MODEL_PREFERENCES)) {
    const models = Object.values(preferences);
    if (models.includes(modelName)) {
      return courseType as CourseType;
    }
  }

  return undefined;
}

/**
 * Get the preferred AI model name for a course type and subscription tier.
 *
 * @param courseType - The course type
 * @param tier - The university subscription tier ('basic', 'standard', 'premium')
 * @returns The preferred model name
 */
export function getPreferredModel(
  courseType: CourseType,
  tier: 'basic' | 'standard' | 'premium'
): string {
  return COURSE_TYPE_MODEL_PREFERENCES[courseType][tier];
}

/**
 * Get all possible models for a course type (across all tiers).
 *
 * @param courseType - The course type
 * @returns Array of model names for this course type
 */
export function getAllModelsForCourseType(courseType: CourseType): string[] {
  const preferences = COURSE_TYPE_MODEL_PREFERENCES[courseType];
  return [preferences.basic, preferences.standard, preferences.premium];
}

/**
 * Check if a model is valid for a course type and tier.
 *
 * @param modelName - The AI model name
 * @param courseType - The course type
 * @param tier - The university subscription tier
 * @returns true if the model is allowed for this course type and tier
 */
export function isModelValidForTier(
  modelName: string,
  courseType: CourseType,
  tier: 'basic' | 'standard' | 'premium'
): boolean {
  const preferences = COURSE_TYPE_MODEL_PREFERENCES[courseType];

  // Build allowed models based on tier
  const allowedModels: string[] = [];

  if (tier === 'basic') {
    allowedModels.push(preferences.basic);
  } else if (tier === 'standard') {
    allowedModels.push(preferences.basic, preferences.standard);
  } else {
    allowedModels.push(preferences.basic, preferences.standard, preferences.premium);
  }

  return allowedModels.includes(modelName);
}
