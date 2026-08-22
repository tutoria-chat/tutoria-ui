'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Check, ChevronDown, ChevronRight, Copy, Link2, Plug, Plus, RefreshCw, Trash2, TriangleAlert,
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { apiClient } from '@/lib/api';
import { formatDateShort } from '@/lib/utils';
import type {
  BreadcrumbItem, Course, LtiContextMapping, LtiRegistration, LtiSetupInfo,
} from '@/lib/types';
import { toast } from 'sonner';

/** A read-only field with a copy button — used for the URLs pasted into the LMS. */
function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Não foi possível copiar.');
    }
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded-md border bg-muted/40 px-3 py-2 text-xs">{value}</code>
        <Button type="button" variant="outline" size="sm" onClick={copy} aria-label={`Copiar ${label}`}>
          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

const EMPTY_FORM = {
  name: '',
  issuer: '',
  clientId: '',
  deploymentId: '',
  authLoginUrl: '',
  authTokenUrl: '',
  keySetUrl: '',
};

export default function IntegrationsPage() {
  const t = useTranslations('lti');
  const { user } = useAuth();
  const { confirm, dialog } = useConfirmDialog();

  const [setup, setSetup] = useState<LtiSetupInfo | null>(null);
  const [registrations, setRegistrations] = useState<LtiRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  // Course mapping state, keyed by registration id
  const [expanded, setExpanded] = useState<number | null>(null);
  const [contexts, setContexts] = useState<Record<number, LtiContextMapping[]>>({});
  const [courses, setCourses] = useState<Course[]>([]);

  const breadcrumbs: BreadcrumbItem[] = [{ label: t('title'), isCurrentPage: true }];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [info, list] = await Promise.all([
        apiClient.getLtiSetupInfo(),
        apiClient.getLtiRegistrations(),
      ]);
      setSetup(info);
      setRegistrations(list);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  // Courses are only needed for the mapping dropdown, so load them lazily.
  useEffect(() => {
    if (expanded === null || courses.length > 0) return;
    const universityId = registrations.find(r => r.id === expanded)?.universityId;
    if (!universityId) return;

    apiClient
      .getCoursesByUniversity(universityId)
      .then(setCourses)
      .catch(() => toast.error(t('coursesLoadError')));
  }, [expanded, courses.length, registrations, t]);

  const toggleContexts = async (registration: LtiRegistration) => {
    if (expanded === registration.id) {
      setExpanded(null);
      return;
    }
    setExpanded(registration.id);

    if (!contexts[registration.id]) {
      try {
        const list = await apiClient.getLtiContexts(registration.id);
        setContexts(prev => ({ ...prev, [registration.id]: list }));
      } catch {
        toast.error(t('contextsLoadError'));
      }
    }
  };

  const handleCreate = async () => {
    if (!user?.universityId && user?.role !== 'super_admin') {
      toast.error(t('noUniversity'));
      return;
    }

    setSaving(true);
    try {
      const created = await apiClient.createLtiRegistration({
        ...form,
        name: form.name || undefined,
        universityId: user?.universityId ?? 0,
      });
      setRegistrations(prev => [...prev, created]);
      setModalOpen(false);
      setForm({ ...EMPTY_FORM });
      toast.success(t('created'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('createError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (registration: LtiRegistration) => {
    confirm({
      title: t('deleteTitle'),
      description: t('deleteDescription', { name: registration.name || registration.issuer }),
      confirmText: t('delete'),
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await apiClient.deleteLtiRegistration(registration.id);
          setRegistrations(prev => prev.filter(r => r.id !== registration.id));
          toast.success(t('deleted'));
        } catch (error) {
          toast.error(error instanceof Error ? error.message : t('deleteError'));
        }
      },
    });
  };

  const handleMapCourse = async (registrationId: number, mappingId: number, courseId: string) => {
    const value = courseId === 'none' ? null : Number(courseId);
    try {
      const updated = await apiClient.setLtiContextCourse(registrationId, mappingId, value);
      setContexts(prev => ({
        ...prev,
        [registrationId]: (prev[registrationId] ?? []).map(m => (m.id === mappingId ? updated : m)),
      }));
      toast.success(t('mapped'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('mapError'));
    }
  };

  const formValid = useMemo(
    () => [form.issuer, form.clientId, form.deploymentId, form.authLoginUrl, form.authTokenUrl, form.keySetUrl]
      .every(v => v.trim().length > 0),
    [form],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              {t('connect')}
            </Button>
          </div>
        }
      />

      {setup && !setup.enabled && (
        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" />
          <AlertDescription>{t('disabled')}</AlertDescription>
        </Alert>
      )}

      {/* Step 1 — what the LMS admin needs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plug className="h-4 w-4" />
            {t('step1Title')}
          </CardTitle>
          <CardDescription>{t('step1Description')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {setup ? (
            <>
              <CopyField label={t('loginUrl')} value={setup.loginUrl} />
              <CopyField label={t('launchUrl')} value={setup.launchUrl} />
              <CopyField label={t('jwksUrl')} value={setup.jwksUrl} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t('loading')}</p>
          )}
        </CardContent>
      </Card>

      {/* Step 2 — connected platforms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('step2Title')}</CardTitle>
          <CardDescription>{t('step2Description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <p className="text-sm text-muted-foreground">{t('loading')}</p>}

          {!loading && registrations.length === 0 && (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Plug className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">{t('emptyTitle')}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t('emptyDescription')}</p>
            </div>
          )}

          {registrations.map(registration => {
            const isOpen = expanded === registration.id;
            const mappings = contexts[registration.id] ?? [];
            const unmapped = mappings.filter(m => !m.isMapped).length;

            return (
              <div key={registration.id} className="rounded-lg border">
                <div className="flex items-center justify-between gap-3 p-4">
                  <button
                    type="button"
                    onClick={() => void toggleContexts(registration)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    {isOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                    <div className="min-w-0">
                      <p className="truncate font-medium">{registration.name || registration.issuer}</p>
                      <p className="truncate text-xs text-muted-foreground">{registration.issuer}</p>
                    </div>
                  </button>

                  <div className="flex shrink-0 items-center gap-2">
                    {unmapped > 0 && (
                      <Badge variant="outline" className="text-amber-600">
                        {t('unmappedCount', { count: unmapped })}
                      </Badge>
                    )}
                    <Badge variant={registration.isActive ? 'default' : 'secondary'}>
                      {registration.isActive ? t('active') : t('inactive')}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(registration)}
                      aria-label={t('delete')}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t bg-muted/20 p-4">
                    <p className="mb-3 flex items-center gap-2 text-sm font-medium">
                      <Link2 className="h-4 w-4" />
                      {t('coursesTitle')}
                    </p>

                    {mappings.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t('noContexts')}</p>
                    ) : (
                      <div className="space-y-2">
                        {mappings.map(mapping => (
                          <div
                            key={mapping.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-background p-3"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {mapping.contextTitle || mapping.contextId}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {mapping.contextLabel ? `${mapping.contextLabel} · ` : ''}
                                {mapping.lastSeenAt ? formatDateShort(mapping.lastSeenAt) : ''}
                              </p>
                            </div>

                            <Select
                              value={mapping.courseId ? String(mapping.courseId) : 'none'}
                              onValueChange={v => void handleMapCourse(registration.id, mapping.id, v)}
                            >
                              <SelectTrigger className="w-full sm:w-64">
                                <SelectValue placeholder={t('selectCourse')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">{t('notLinked')}</SelectItem>
                                {courses.map(course => (
                                  <SelectItem key={course.id} value={String(course.id)}>
                                    {course.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Connect dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('connect')}</DialogTitle>
            <DialogDescription>{t('connectDescription')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="lti-name">{t('fieldName')}</Label>
              <Input
                id="lti-name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="AVA da Universidade"
              />
            </div>

            {([
              ['issuer', t('fieldIssuer'), 'https://ava.universidade.edu.br'],
              ['clientId', t('fieldClientId'), ''],
              ['deploymentId', t('fieldDeploymentId'), ''],
              ['authLoginUrl', t('fieldAuthLoginUrl'), 'https://ava.universidade.edu.br/mod/lti/auth.php'],
              ['authTokenUrl', t('fieldAuthTokenUrl'), 'https://ava.universidade.edu.br/mod/lti/token.php'],
              ['keySetUrl', t('fieldKeySetUrl'), 'https://ava.universidade.edu.br/mod/lti/certs.php'],
            ] as const).map(([key, label, placeholder]) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={`lti-${key}`}>
                  {label} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={`lti-${key}`}
                  value={form[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              {t('cancel')}
            </Button>
            <Button onClick={() => void handleCreate()} disabled={!formValid || saving}>
              {saving ? t('saving') : t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {dialog}
    </div>
  );
}
