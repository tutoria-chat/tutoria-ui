import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { apiClient } from '@/lib/api';
import type { University, Course, Module } from '@/lib/types';

interface NavigationContext {
  universityId: number | null;
  courseId: number | null;
  moduleId: number | null;
  university: University | null;
  course: Course | null;
  module: Module | null;
  loading: boolean;
}

/**
 * Custom hook to extract and load navigation context from the current URL
 * Detects when viewing university/course/module pages and loads their data
 */
export function useNavigationContext(): NavigationContext {
  const pathname = usePathname();
  const [context, setContext] = useState<NavigationContext>({
    universityId: null,
    courseId: null,
    moduleId: null,
    university: null,
    course: null,
    module: null,
    loading: false,
  });

  useEffect(() => {
    const loadContext = async () => {
      // Parse URL to extract IDs
      // Patterns: /universities/[id], /courses/[id], /modules/[id]
      const universityMatch = pathname.match(/\/universities\/(\d+)/);
      const courseMatch = pathname.match(/\/courses\/(\d+)/);
      const moduleMatch = pathname.match(/\/modules\/(\d+)/);

      const universityId = universityMatch ? parseInt(universityMatch[1]) : null;
      const courseId = courseMatch ? parseInt(courseMatch[1]) : null;
      const moduleId = moduleMatch ? parseInt(moduleMatch[1]) : null;

      // If no context, reset
      if (!universityId && !courseId && !moduleId) {
        setContext({
          universityId: null,
          courseId: null,
          moduleId: null,
          university: null,
          course: null,
          module: null,
          loading: false,
        });
        return;
      }

      setContext(prev => ({ ...prev, loading: true }));

      try {
        let university: University | null = null;
        let course: Course | null = null;
        let module: Module | null = null;

        // Load module (includes course info)
        if (moduleId) {
          module = await apiClient.getModule(moduleId);
          if (module.courseId) {
            course = await apiClient.getCourse(module.courseId);
            if (course.universityId) {
              university = await apiClient.getUniversity(course.universityId);
            }
          }
        }
        // Load course (includes university info)
        else if (courseId) {
          course = await apiClient.getCourse(courseId);
          if (course.universityId) {
            university = await apiClient.getUniversity(course.universityId);
          }
        }
        // Load university only
        else if (universityId) {
          university = await apiClient.getUniversity(universityId);
        }

        setContext({
          universityId: university?.id || null,
          courseId: course?.id || null,
          moduleId: module?.id || null,
          university,
          course,
          module,
          loading: false,
        });
      } catch (error) {
        console.error('Error loading navigation context:', error);
        setContext(prev => ({ ...prev, loading: false }));
      }
    };

    loadContext();
  }, [pathname]);

  return context;
}
