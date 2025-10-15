'use client';

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/auth/auth-provider';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  ChevronRight,
  Shield,
  Users,
  GraduationCap,
  Home,
  Building2,
  FileText,
  Key,
  Settings,
  HelpCircle,
  Lightbulb,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Section {
  id: string;
  title: string;
  icon?: React.ElementType;
  subsections?: { id: string; title: string }[];
}

export default function TutorialsPage() {
  const { user, isLoading } = useAuth();
  const t = useTranslations('tutorials');
  const [activeSection, setActiveSection] = useState<string>('');

  // Determine user role guide
  const roleGuide = useMemo(() => {
    if (!user) return null;

    if (user.role === 'super_admin') {
      return 'superAdmin';
    } else if (user.role === 'professor' && user.is_admin === true) {
      return 'adminProfessor';
    } else if (user.role === 'professor' && user.is_admin === false) {
      return 'regularProfessor';
    }
    return null;
  }, [user]);

  // Build sections based on role
  const sections = useMemo((): Section[] => {
    if (!roleGuide) return [];

    const baseSections: Section[] = [
      { id: 'overview', title: t(`${roleGuide}.overview.title`), icon: Home },
    ];

    if (roleGuide === 'superAdmin') {
      return [
        ...baseSections,
        { id: 'universities', title: t('superAdmin.universities.title'), icon: Building2 },
        { id: 'superAdmins', title: t('superAdmin.superAdmins.title'), icon: Shield },
        { id: 'professors', title: t('superAdmin.professors.title'), icon: Users },
        { id: 'globalSearch', title: t('superAdmin.globalSearch.title'), icon: BookOpen },
        { id: 'moduleTokens', title: t('superAdmin.moduleTokens.title'), icon: Key },
        { id: 'bestPractices', title: t('superAdmin.bestPractices.title'), icon: Lightbulb },
      ];
    } else if (roleGuide === 'adminProfessor') {
      return [
        ...baseSections,
        { id: 'workflow', title: t('adminProfessor.workflow.title'), icon: CheckCircle },
        { id: 'creatingCourses', title: t('adminProfessor.creatingCourses.title'), icon: BookOpen },
        { id: 'creatingModules', title: t('adminProfessor.creatingModules.title'), icon: FileText },
        { id: 'uploadingFiles', title: t('adminProfessor.uploadingFiles.title'), icon: FileText },
        { id: 'creatingTokens', title: t('adminProfessor.creatingTokens.title'), icon: Key },
        { id: 'preparingModules', title: t('adminProfessor.preparingModules.title'), icon: Settings },
      ];
    } else {
      return [
        ...baseSections,
        { id: 'note', title: t('regularProfessor.note'), icon: AlertTriangle },
      ];
    }
  }, [roleGuide]);

  // Get role display info
  const getRoleInfo = () => {
    if (!user || !roleGuide) return null;

    const roleIcons = {
      superAdmin: Shield,
      adminProfessor: Users,
      regularProfessor: GraduationCap,
    };

    const roleColors = {
      superAdmin: 'text-red-600',
      adminProfessor: 'text-purple-600',
      regularProfessor: 'text-blue-600',
    };

    const RoleIcon = roleIcons[roleGuide];

    return {
      icon: RoleIcon,
      color: roleColors[roleGuide],
      title: t(`${roleGuide}.title`),
      subtitle: t(`${roleGuide}.subtitle`),
    };
  };

  const roleInfo = getRoleInfo();

  // Scroll to section
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Render section content
  const renderSectionContent = (sectionId: string) => {
    if (!roleGuide) return null;

    const sectionKey = `${roleGuide}.${sectionId}`;

    // Check if section exists in translations
    try {
      const sectionTitle = t(`${sectionKey}.title`);

      return (
        <Card key={sectionId} id={`section-${sectionId}`} className="scroll-mt-6 mb-6">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center space-x-2">
              {sections.find(s => s.id === sectionId)?.icon && (
                React.createElement(sections.find(s => s.id === sectionId)!.icon!, { className: 'h-6 w-6' })
              )}
              <span>{sectionTitle}</span>
            </CardTitle>
            {t.has(`${sectionKey}.description`) && (
              <CardDescription className="text-base mt-2">
                {t(`${sectionKey}.description`)}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {renderSectionDetails(sectionKey, sectionId)}
          </CardContent>
        </Card>
      );
    } catch (error) {
      console.error(`Missing translation for section: ${sectionKey}`, error);
      return null;
    }
  };

  // Render detailed section content
  const renderSectionDetails = (sectionKey: string, sectionId: string) => {
    const content: React.ReactNode[] = [];

    // Overview section
    if (sectionId === 'overview') {
      content.push(
        <div key="overview" className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          {t.has(`${sectionKey}.whatIs`) && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <p className="text-base leading-relaxed whitespace-pre-line">{t(`${sectionKey}.whatIs`)}</p>
            </div>
          )}

          {t.has(`${sectionKey}.responsibilities`) && (() => {
            const rawResponsibilities = t.raw(`${sectionKey}.responsibilities`);
            if (!Array.isArray(rawResponsibilities)) {
              console.error(`Invalid structure for responsibilities in ${sectionKey}`);
              return null;
            }
            const responsibilities = rawResponsibilities as string[];
            return (
              <>
                <h3 className="text-xl font-bold mt-8 mb-4 flex items-center">
                  <Shield className="h-6 w-6 mr-2 text-primary" />
                  {t(`${sectionKey}.responsibilitiesTitle`) || 'Responsibilities'}
                </h3>
                <ul className="space-y-3">
                  {responsibilities.map((responsibility, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircle className="h-5 w-5 mr-3 mt-0.5 text-green-600 shrink-0" />
                      <span className="text-base">{responsibility}</span>
                    </li>
                  ))}
                </ul>
              </>
            );
          })()}
        </div>
      );
    }

    // Workflow section - render numbered steps from workflow.steps array
    else if (sectionId === 'workflow') {
      if (t.has(`${sectionKey}.steps`)) {
        const rawSteps = t.raw(`${sectionKey}.steps`);
        if (!Array.isArray(rawSteps)) {
          console.error(`Invalid structure for workflow steps in ${sectionKey}`);
        } else {
          const steps = rawSteps as Array<{ number: number; title: string; description: string }>;
          content.push(
            <div key="workflow-steps" className="space-y-4">
              {steps.map((step, idx) => (
                <Card key={idx} className="bg-gradient-to-r from-primary/5 to-accent/5">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                        {step.number}
                      </div>
                      <span>{step.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-base leading-relaxed whitespace-pre-line">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          );
        }
      }
    }

    // Tutorial sections (creatingCourses, creatingModules, etc.)
    else if (['creatingCourses', 'creatingModules', 'uploadingFiles', 'creatingTokens', 'preparingModules'].includes(sectionId)) {
      // "What Is" explanation
      if (t.has(`${sectionKey}.whatIs`)) {
        content.push(
          <div key="whatIs" className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-3 flex items-center">
              <HelpCircle className="h-5 w-5 mr-2 text-blue-600" />
              {t(`${sectionKey}.whatIsTitle`) || 'What is this?'}
            </h3>
            <p className="text-base leading-relaxed whitespace-pre-line">{t(`${sectionKey}.whatIs`)}</p>
          </div>
        );
      }

      // "Why" section
      if (t.has(`${sectionKey}.why`)) {
        content.push(
          <div key="why" className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-3 flex items-center">
              <Lightbulb className="h-5 w-5 mr-2 text-purple-600" />
              {t(`${sectionKey}.whyTitle`) || 'Why is this important?'}
            </h3>
            <p className="text-base leading-relaxed whitespace-pre-line">{t(`${sectionKey}.why`)}</p>
          </div>
        );
      }

      // Step-by-step instructions
      if (t.has(`${sectionKey}.steps`)) {
        const rawSteps = t.raw(`${sectionKey}.steps`);
        if (!Array.isArray(rawSteps)) {
          console.error(`Invalid structure for steps in ${sectionKey}`);
        } else {
          const steps = rawSteps as Array<{ number: number; title: string; desc: string }>;
          content.push(
            <div key="steps" className="space-y-4">
              <h3 className="text-xl font-bold mt-6 mb-4 flex items-center">
                <BookOpen className="h-6 w-6 mr-2 text-primary" />
                {t(`${sectionKey}.stepsTitle`) || 'Step-by-Step Instructions'}
              </h3>
              {steps.map((step, idx) => (
                <Card key={idx} className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-l-4 border-green-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm">
                        {step.number}
                      </div>
                      <span className="font-bold">{step.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-base leading-relaxed whitespace-pre-line">{step.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          );
        }
      }

      // "What You Should See" confirmation
      if (t.has(`${sectionKey}.whatYouShouldSee`)) {
        content.push(
          <div key="whatYouShouldSee" className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-3 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              {t(`${sectionKey}.whatYouShouldSeeTitle`) || 'What You Should See'}
            </h3>
            <p className="text-base leading-relaxed whitespace-pre-line">{t(`${sectionKey}.whatYouShouldSee`)}</p>
          </div>
        );
      }

      // Common Mistakes
      if (t.has(`${sectionKey}.commonMistakes`)) {
        const rawMistakes = t.raw(`${sectionKey}.commonMistakes`);
        if (!Array.isArray(rawMistakes)) {
          console.error(`Invalid structure for commonMistakes in ${sectionKey}`);
        } else {
          const mistakes = rawMistakes as Array<{ problem: string; solution: string }>;
          content.push(
            <div key="commonMistakes" className="space-y-4">
              <h3 className="text-xl font-bold mt-8 mb-4 flex items-center">
                <AlertTriangle className="h-6 w-6 mr-2 text-amber-600" />
                {t(`${sectionKey}.commonMistakesTitle`) || 'Common Mistakes'}
              </h3>
              {mistakes.map((mistake, idx) => (
                <Card key={idx} className="bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500">
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-base font-semibold text-amber-900 dark:text-amber-100">
                        ❌ {mistake.problem}
                      </p>
                      <p className="text-base text-green-700 dark:text-green-400 ml-4">
                        ✅ {mistake.solution}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          );
        }
      }

      // Troubleshooting
      if (t.has(`${sectionKey}.troubleshooting`)) {
        const rawTroubleshooting = t.raw(`${sectionKey}.troubleshooting`);
        if (!Array.isArray(rawTroubleshooting)) {
          console.error(`Invalid structure for troubleshooting in ${sectionKey}`);
        } else {
          const troubleshooting = rawTroubleshooting as Array<{ problem: string; solution: string }>;
          content.push(
            <div key="troubleshooting" className="space-y-4">
              <h3 className="text-xl font-bold mt-8 mb-4 flex items-center">
                <Settings className="h-6 w-6 mr-2 text-red-600" />
                {t(`${sectionKey}.troubleshootingTitle`) || 'Troubleshooting'}
              </h3>
              {troubleshooting.map((item, idx) => (
                <Card key={idx} className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500">
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-base font-semibold text-red-900 dark:text-red-100">
                        🔴 {item.problem}
                      </p>
                      <p className="text-base text-blue-700 dark:text-blue-400 ml-4">
                        💡 {item.solution}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          );
        }
      }

      // Tips
      if (t.has(`${sectionKey}.tips`)) {
        const rawTips = t.raw(`${sectionKey}.tips`);
        if (!Array.isArray(rawTips)) {
          console.error(`Invalid structure for tips in ${sectionKey}`);
        } else {
          const tips = rawTips as string[];
          content.push(
            <div key="tips" className="space-y-3">
              <h3 className="text-xl font-bold mt-8 mb-4 flex items-center">
                <Lightbulb className="h-6 w-6 mr-2 text-yellow-600" />
                {t(`${sectionKey}.tipsTitle`) || 'Helpful Tips'}
              </h3>
              <ul className="space-y-3">
                {tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <Lightbulb className="h-5 w-5 mr-3 mt-0.5 text-yellow-600 shrink-0" />
                    <span className="text-base">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        }
      }

      // Special sections for specific tutorials
      if (sectionId === 'creatingModules') {
        // AI Tutor configuration section
        if (t.has(`${sectionKey}.aiTutorConfig`)) {
          const rawAiConfig = t.raw(`${sectionKey}.aiTutorConfig`);
          if (typeof rawAiConfig !== 'object' || !rawAiConfig || !('whatIs' in rawAiConfig)) {
            console.error(`Invalid structure for aiTutorConfig in ${sectionKey}`);
          } else {
            const aiConfig = rawAiConfig as { whatIs: string; howToWrite: string; example: string };
            content.push(
              <div key="aiTutorConfig" className="space-y-4">
                <h3 className="text-xl font-bold mt-8 mb-4 flex items-center">
                  <GraduationCap className="h-6 w-6 mr-2 text-indigo-600" />
                  {t(`${sectionKey}.aiTutorConfigTitle`) || 'AI Tutor Configuration'}
                </h3>
                <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6 space-y-4">
                  <p className="text-base leading-relaxed whitespace-pre-line">{aiConfig.whatIs}</p>
                  <p className="text-base leading-relaxed whitespace-pre-line">{aiConfig.howToWrite}</p>
                  <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4 font-mono text-sm">
                    <p className="whitespace-pre-line">{aiConfig.example}</p>
                  </div>
                </div>
              </div>
            );
          }
        }
      }

      if (sectionId === 'uploadingFiles') {
        // Supported formats section
        if (t.has(`${sectionKey}.supportedFormats`)) {
          const rawFormats = t.raw(`${sectionKey}.supportedFormats`);
          if (typeof rawFormats !== 'object' || !rawFormats || !('title' in rawFormats) || !('list' in rawFormats)) {
            console.error(`Invalid structure for supportedFormats in ${sectionKey}`);
          } else {
            const formats = rawFormats as { title: string; list: string[] };
            content.push(
              <div key="supportedFormats" className="bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-3">{formats.title}</h3>
                <ul className="space-y-2">
                  {formats.list.map((format, idx) => (
                    <li key={idx} className="flex items-start">
                      <FileText className="h-5 w-5 mr-2 mt-0.5 text-slate-600 shrink-0" />
                      <span className="text-base">{format}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          }
        }
      }

      if (sectionId === 'creatingTokens') {
        // Distribution methods section
        if (t.has(`${sectionKey}.distribution`)) {
          const rawDistribution = t.raw(`${sectionKey}.distribution`);
          if (typeof rawDistribution !== 'object' || !rawDistribution || !('title' in rawDistribution) || !('methods' in rawDistribution)) {
            console.error(`Invalid structure for distribution in ${sectionKey}`);
          } else {
            const distribution = rawDistribution as { title: string; methods: Array<{ name: string; description: string }> };
            content.push(
              <div key="distribution" className="space-y-4">
                <h3 className="text-xl font-bold mt-8 mb-4 flex items-center">
                  <Key className="h-6 w-6 mr-2 text-cyan-600" />
                  {distribution.title}
                </h3>
                {distribution.methods.map((method, idx) => (
                  <Card key={idx} className="bg-cyan-50 dark:bg-cyan-950/20 border-l-4 border-cyan-500">
                    <CardHeader>
                      <CardTitle className="text-base">{method.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-base whitespace-pre-line">{method.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          }
        }
      }

      if (sectionId === 'preparingModules') {
        // Testing steps section
        if (t.has(`${sectionKey}.testing`)) {
          const rawTesting = t.raw(`${sectionKey}.testing`);
          if (typeof rawTesting !== 'object' || !rawTesting || !('title' in rawTesting) || !('steps' in rawTesting)) {
            console.error(`Invalid structure for testing in ${sectionKey}`);
          } else {
            const testing = rawTesting as { title: string; steps: Array<{ number: number; action: string }> };
            content.push(
              <div key="testing" className="space-y-4">
                <h3 className="text-xl font-bold mt-8 mb-4">{testing.title}</h3>
                {testing.steps.map((step, idx) => (
                  <Card key={idx} className="bg-blue-50 dark:bg-blue-950/20">
                    <CardContent className="pt-6">
                      <div className="flex items-start space-x-3">
                        <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                          {step.number}
                        </div>
                        <p className="text-base">{step.action}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          }
        }

        // Final checklist section
        if (t.has(`${sectionKey}.finalChecklist`)) {
          const rawChecklist = t.raw(`${sectionKey}.finalChecklist`);
          if (typeof rawChecklist !== 'object' || !rawChecklist || !('title' in rawChecklist) || !('items' in rawChecklist)) {
            console.error(`Invalid structure for finalChecklist in ${sectionKey}`);
          } else {
            const checklist = rawChecklist as { title: string; items: string[] };
            content.push(
              <div key="finalChecklist" className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <CheckCircle className="h-6 w-6 mr-2 text-green-600" />
                  {checklist.title}
                </h3>
                <ul className="space-y-2">
                  {checklist.items.map((item, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircle className="h-5 w-5 mr-2 mt-0.5 text-green-600 shrink-0" />
                      <span className="text-base">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          }
        }
      }
    }

    // Regular professor note
    else if (sectionId === 'note') {
      if (t.has(`${sectionKey}`)) {
        content.push(
          <div key="note" className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <p className="text-base leading-relaxed whitespace-pre-line">{t(`${sectionKey}`)}</p>
          </div>
        );
      }
    }

    return content.length > 0 ? content : <p className="text-muted-foreground">Content not available.</p>;
  };

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="xl" className="text-primary" />
      </div>
    );
  }

  if (!roleGuide || !roleInfo) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t('title')}
          description={t('description')}
        />
        <Card>
          <CardContent className="p-12 text-center">
            <HelpCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">No tutorial available for your user role.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const RoleIcon = roleInfo.icon;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
      />

      {/* Role Badge */}
      <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className={cn("h-16 w-16 rounded-full flex items-center justify-center bg-white dark:bg-slate-900", roleInfo.color)}>
              <RoleIcon className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{roleInfo.title}</h2>
              <p className="text-base text-muted-foreground">{roleInfo.subtitle}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Table of Contents - Sidebar */}
        <Card className="lg:col-span-1 h-fit lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>{t('tableOfContents')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-300px)]">
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2",
                      activeSection === section.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {section.icon && <section.icon className="h-4 w-4 shrink-0" />}
                    <span className="truncate">{section.title}</span>
                  </button>
                ))}
              </nav>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Sections */}
          <div className="space-y-6">
            {sections.map(section => renderSectionContent(section.id))}
          </div>

          {/* Common Sections (available to all) */}
          <Card id="section-common">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center space-x-2">
                <Settings className="h-6 w-6" />
                <span>Common Features</span>
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Features available to all users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Password Setup */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold border-l-4 border-primary pl-3">
                  {t('common.passwordSetup.title')}
                </h3>
                <p className="text-base text-muted-foreground ml-4">
                  {t('common.passwordSetup.description')}
                </p>
                <ol className="ml-8 space-y-2 list-decimal">
                  {(() => {
                    const rawSteps = t.raw('common.passwordSetup.steps');
                    if (!Array.isArray(rawSteps)) {
                      console.error('Invalid structure for common.passwordSetup.steps');
                      return null;
                    }
                    return (rawSteps as string[]).map((step, idx) => (
                      <li key={idx} className="text-base">{step}</li>
                    ));
                  })()}
                </ol>
                <div className="ml-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-base flex items-start">
                    <HelpCircle className="h-5 w-5 mr-2 mt-0.5 text-blue-600 shrink-0" />
                    <span>{t('common.passwordSetup.note')}</span>
                  </p>
                </div>
              </div>

              <Separator />

              {/* Profile Settings */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold border-l-4 border-primary pl-3">
                  {t('common.profileSettings.title')}
                </h3>
                <p className="text-base text-muted-foreground ml-4">
                  {t('common.profileSettings.description')}
                </p>

                <div className="ml-4 space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">{t('common.profileSettings.theme.title')}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{t('common.profileSettings.theme.description')}</p>
                    <ul className="ml-4 space-y-1">
                      {(() => {
                        const rawOptions = t.raw('common.profileSettings.theme.options');
                        if (!Array.isArray(rawOptions)) {
                          console.error('Invalid structure for common.profileSettings.theme.options');
                          return null;
                        }
                        return (rawOptions as string[]).map((option, idx) => (
                          <li key={idx} className="text-sm flex items-start">
                            <ChevronRight className="h-4 w-4 mr-1 mt-0.5 text-primary shrink-0" />
                            <span>{option}</span>
                          </li>
                        ));
                      })()}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">{t('common.profileSettings.language.title')}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{t('common.profileSettings.language.description')}</p>
                    <ul className="ml-4 space-y-1">
                      {(() => {
                        const rawOptions = t.raw('common.profileSettings.language.options');
                        if (!Array.isArray(rawOptions)) {
                          console.error('Invalid structure for common.profileSettings.language.options');
                          return null;
                        }
                        return (rawOptions as string[]).map((option, idx) => (
                          <li key={idx} className="text-sm flex items-start">
                            <ChevronRight className="h-4 w-4 mr-1 mt-0.5 text-primary shrink-0" />
                            <span>{option}</span>
                          </li>
                        ));
                      })()}
                    </ul>
                    <p className="text-sm text-muted-foreground mt-2 italic">{t('common.profileSettings.language.note')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
