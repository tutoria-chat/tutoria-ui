'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Mail, X, UserPlus, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/components/auth/auth-provider';
import type { UserRole, University, BulkInviteResult } from '@/lib/types';

export default function CreateUserPage() {
  const t = useTranslations('users.create');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { user: currentUser } = useAuth();

  // Form state
  const [emails, setEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [userType, setUserType] = useState<string>('');
  const [universityId, setUniversityId] = useState<string>('');
  const [languagePreference, setLanguagePreference] = useState('pt-br');
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BulkInviteResult | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUniversities();
  }, []);

  // Pre-select university for non-super-admin users
  useEffect(() => {
    if (currentUser?.universityId) {
      setUniversityId(currentUser.universityId.toString());
    }
  }, [currentUser?.universityId]);

  const fetchUniversities = async () => {
    try {
      const response = await apiClient.get<{ items: University[]; total: number } | University[]>('/api/universities?size=100');
      const items = Array.isArray(response) ? response : (response?.items ?? []);
      setUniversities(items);
    } catch (error) {
      console.error('Failed to fetch universities:', error);
    }
  };

  const isUniversityScopedRole = (role: string) => {
    if (!role) return false;
    const universityScopedRoles: UserRole[] = ['manager', 'tutor', 'platform_coordinator', 'professor'];
    return universityScopedRoles.includes(role as UserRole);
  };

  const isSuperAdmin = currentUser?.userType === 'super_admin';

  // ==================== Email Parsing Logic ====================

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const parseAndAddEmails = (input: string) => {
    const parsed = input
      .split(/[,;\s\n]+/)
      .map(e => e.trim().toLowerCase())
      .filter(e => e.length > 0);

    const validEmails: string[] = [];
    const invalidEmails: string[] = [];

    for (const email of parsed) {
      if (isValidEmail(email)) {
        if (!emails.includes(email) && !validEmails.includes(email)) {
          validEmails.push(email);
        }
      } else {
        invalidEmails.push(email);
      }
    }

    if (validEmails.length > 0) {
      setEmails(prev => [...prev, ...validEmails].slice(0, 50));
    }

    if (invalidEmails.length > 0) {
      setErrors(prev => ({ ...prev, emails: t('invite.invalidEmails', { emails: invalidEmails.join(', ') }) }));
    } else {
      setErrors(prev => {
        const next = { ...prev };
        delete next.emails;
        return next;
      });
    }

    setEmailInput('');
  };

  const removeEmail = (email: string) => {
    setEmails(prev => prev.filter(e => e !== email));
  };

  const handleEmailKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', 'Tab', ',', ' '].includes(e.key) && emailInput.trim()) {
      e.preventDefault();
      parseAndAddEmails(emailInput);
    }
    // Backspace with empty input removes last email
    if (e.key === 'Backspace' && !emailInput && emails.length > 0) {
      setEmails(prev => prev.slice(0, -1));
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    parseAndAddEmails(pasted);
  };

  // ==================== Form Submission ====================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Add any remaining input
    if (emailInput.trim()) {
      parseAndAddEmails(emailInput);
    }

    // Validate
    const newErrors: { [key: string]: string } = {};
    if (emails.length === 0 && !emailInput.trim()) {
      newErrors.emails = t('errors.emailRequired');
    }
    if (!userType) {
      newErrors.userType = t('errors.userTypeRequired');
    }
    if (isUniversityScopedRole(userType) && !universityId) {
      newErrors.universityId = t('errors.universityRequired');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const result = await apiClient.bulkInvite({
        emails,
        userType,
        universityId: universityId ? parseInt(universityId) : undefined,
        languagePreference,
      });
      setResults(result);
      // Clear form emails on success
      setEmails([]);
      setEmailInput('');
    } catch (error: any) {
      toast.error(error.message || t('errorMessage'));
    } finally {
      setLoading(false);
    }
  };

  const handleSendMore = () => {
    setResults(null);
    setEmails([]);
    setEmailInput('');
    setErrors({});
  };

  // ==================== Render ====================

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
      >
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {tCommon('buttons.back')}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{t('invite.formTitle')}</CardTitle>
          <CardDescription>{t('invite.formDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="userType">{t('fields.userType.label')} *</Label>
              <Select
                value={userType}
                onValueChange={(value) => {
                  setUserType(value);
                  if (errors.userType) {
                    setErrors(prev => ({ ...prev, userType: '' }));
                  }
                }}
              >
                <SelectTrigger id="userType">
                  <SelectValue placeholder={t('fields.userType.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {isSuperAdmin && (
                    <SelectItem value="super_admin">{tCommon('roles.super_admin')}</SelectItem>
                  )}
                  <SelectItem value="manager">{tCommon('roles.manager')}</SelectItem>
                  <SelectItem value="tutor">{tCommon('roles.tutor')}</SelectItem>
                  <SelectItem value="platform_coordinator">{tCommon('roles.platform_coordinator')}</SelectItem>
                  <SelectItem value="professor">{tCommon('roles.professor')}</SelectItem>
                  <SelectItem value="student">{tCommon('roles.student')}</SelectItem>
                </SelectContent>
              </Select>
              {userType && (
                <p className="text-sm text-muted-foreground">
                  {tCommon(`roles.descriptions.${userType}`)}
                </p>
              )}
              {errors.userType && <p className="text-sm text-destructive">{errors.userType}</p>}
            </div>

            {/* University Selection (for university-scoped roles) */}
            {isUniversityScopedRole(userType) && (
              <div className="space-y-2">
                <Label htmlFor="universityId">{t('fields.university.label')} *</Label>
                <Select
                  value={universityId}
                  onValueChange={(value) => {
                    setUniversityId(value);
                    if (errors.universityId) {
                      setErrors(prev => ({ ...prev, universityId: '' }));
                    }
                  }}
                  disabled={!isSuperAdmin && !!currentUser?.universityId}
                >
                  <SelectTrigger id="universityId">
                    <SelectValue placeholder={t('fields.university.placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {universities.map((university) => (
                      <SelectItem key={university.id} value={university.id.toString()}>
                        {university.name} ({university.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.universityId && <p className="text-sm text-destructive">{errors.universityId}</p>}
              </div>
            )}

            {/* Email Input Area */}
            <div className="space-y-2">
              <Label>{t('invite.emailLabel')} *</Label>
              <div
                className={`min-h-[100px] p-2 rounded-md border bg-background flex flex-wrap gap-1.5 cursor-text ${
                  errors.emails ? 'border-destructive' : ''
                }`}
                onClick={() => emailInputRef.current?.focus()}
              >
                {emails.map((email) => (
                  <Badge key={email} variant="secondary" className="gap-1 pr-1">
                    {email}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeEmail(email); }}
                      className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <input
                  ref={emailInputRef}
                  type="text"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={handleEmailKeyDown}
                  onPaste={handlePaste}
                  onBlur={() => { if (emailInput.trim()) parseAndAddEmails(emailInput); }}
                  placeholder={emails.length === 0 ? t('invite.emailPlaceholder') : ''}
                  className="flex-1 min-w-[200px] outline-none bg-transparent text-sm"
                  disabled={loading || emails.length >= 50}
                />
              </div>
              {errors.emails && <p className="text-sm text-destructive">{errors.emails}</p>}
              <p className="text-xs text-muted-foreground">
                {t('invite.emailHint', { count: emails.length })}
              </p>
              {emails.length >= 45 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {t('invite.maxEmails')}
                </p>
              )}
            </div>

            {/* Language Preference */}
            <div className="space-y-2">
              <Label htmlFor="languagePreference">{t('fields.language.label')}</Label>
              <Select
                value={languagePreference}
                onValueChange={setLanguagePreference}
              >
                <SelectTrigger id="languagePreference">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-br">Portugues (Brasil)</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Espanol</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading || (emails.length === 0 && !emailInput.trim()) || !userType}
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    {t('invite.submitting')}
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    {t('invite.submitButton')}
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                {tCommon('buttons.cancel')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results Section */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>{t('invite.results.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Invited (green) */}
            {results.invited.length > 0 && (
              <div className="rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 p-4">
                <div className="flex items-center gap-2 font-medium text-green-700 dark:text-green-400 mb-2">
                  <Mail className="h-4 w-4" />
                  {t('invite.results.invited', { count: results.invited.length })}
                </div>
                <div className="flex flex-wrap gap-1">
                  {results.invited.map(i => (
                    <Badge key={i.email} variant="outline" className="text-xs">{i.email}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Added (blue) */}
            {results.added.length > 0 && (
              <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 p-4">
                <div className="flex items-center gap-2 font-medium text-blue-700 dark:text-blue-400 mb-2">
                  <UserPlus className="h-4 w-4" />
                  {t('invite.results.added', { count: results.added.length })}
                </div>
                <div className="flex flex-wrap gap-1">
                  {results.added.map(a => (
                    <Badge key={a.email} variant="outline" className="text-xs">
                      {a.name} ({a.email})
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Already Members (gray) */}
            {results.alreadyMembers.length > 0 && (
              <div className="rounded-lg border border-muted bg-muted/30 p-4">
                <div className="flex items-center gap-2 font-medium text-muted-foreground mb-2">
                  <Check className="h-4 w-4" />
                  {t('invite.results.alreadyMembers', { count: results.alreadyMembers.length })}
                </div>
                <div className="flex flex-wrap gap-1">
                  {results.alreadyMembers.map(m => (
                    <Badge key={m.email} variant="outline" className="text-xs">
                      {m.name} ({m.email})
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Errors (red) */}
            {results.errors.length > 0 && (
              <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4">
                <div className="flex items-center gap-2 font-medium text-red-700 dark:text-red-400 mb-2">
                  <AlertCircle className="h-4 w-4" />
                  {t('invite.results.errors', { count: results.errors.length })}
                </div>
                <div className="space-y-1">
                  {results.errors.map(err => (
                    <div key={err.email} className="text-sm">
                      <span className="font-medium">{err.email}</span>
                      <span className="text-muted-foreground"> — {err.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Send More button */}
            <div className="pt-2">
              <Button variant="outline" onClick={handleSendMore}>
                <Mail className="mr-2 h-4 w-4" />
                {t('invite.sendMore')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
