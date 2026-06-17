'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarRange, Plus, Trash2, Pencil, Trophy } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Combobox } from '@/components/ui/combobox';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/components/auth/auth-provider';
import { apiClient } from '@/lib/api';
import type { Semester, University } from '@/lib/types';
import { toast } from 'sonner';

const toIsoStart = (d: string) => new Date(`${d}T00:00:00Z`).toISOString();
const toIsoEnd = (d: string) => new Date(`${d}T23:59:59Z`).toISOString();
const toDateInput = (iso: string) => iso.slice(0, 10);

export default function SemestersPage() {
  const t = useTranslations('semesters');
  const { user } = useAuth();
  const isSuperAdmin = user?.userType === 'super_admin';

  const [universities, setUniversities] = useState<University[]>([]);
  const [universityId, setUniversityId] = useState<number | undefined>(
    isSuperAdmin ? undefined : user?.universityId,
  );
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{ id?: number; label: string; start: string; end: string }>({
    label: '', start: '', end: '',
  });

  useEffect(() => {
    if (!isSuperAdmin) return;
    apiClient.getUniversities({ size: 200 })
      .then((res) => setUniversities(res.items))
      .catch(() => {});
  }, [isSuperAdmin]);

  const load = useCallback(async () => {
    if (!universityId) { setSemesters([]); setLoading(false); return; }
    setLoading(true);
    try {
      setSemesters(await apiClient.getSemesters(universityId));
    } catch {
      toast.error(t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [universityId, t]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => setForm({ label: '', start: '', end: '' });

  const submit = async () => {
    if (!universityId || !form.label.trim() || !form.start || !form.end) {
      toast.error(t('validationError'));
      return;
    }
    setSaving(true);
    try {
      if (form.id) {
        await apiClient.updateSemester(form.id, {
          label: form.label.trim(),
          startsAtUtc: toIsoStart(form.start),
          endsAtUtc: toIsoEnd(form.end),
        });
        toast.success(t('updated'));
      } else {
        await apiClient.createSemester({
          universityId,
          label: form.label.trim(),
          startsAtUtc: toIsoStart(form.start),
          endsAtUtc: toIsoEnd(form.end),
        });
        toast.success(t('created'));
      }
      resetForm();
      load();
    } catch {
      toast.error(t('saveError'));
    } finally {
      setSaving(false);
    }
  };

  const edit = (s: Semester) =>
    setForm({ id: s.id, label: s.label, start: toDateInput(s.startsAtUtc), end: toDateInput(s.endsAtUtc) });

  const remove = async (s: Semester) => {
    if (!confirm(t('confirmDelete', { label: s.label }))) return;
    try {
      await apiClient.deleteSemester(s.id);
      toast.success(t('deleted'));
      load();
    } catch {
      toast.error(t('saveError'));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />

      {isSuperAdmin && (
        <Card>
          <CardContent className="pt-6">
            <Combobox
              options={universities.map((u) => ({ value: String(u.id), label: u.name }))}
              value={universityId ? String(universityId) : ''}
              onValueChange={(v) => setUniversityId(Number(v))}
              placeholder={t('selectUniversity')}
            />
          </CardContent>
        </Card>
      )}

      {!universityId ? (
        <p className="text-sm text-muted-foreground">{t('pickUniversityHint')}</p>
      ) : (
        <>
          {/* Create / edit form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{form.id ? t('editTitle') : t('addTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">{t('labelField')}</label>
                <Input
                  className="w-32"
                  placeholder="2026.1"
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">{t('startField')}</label>
                <DateTimePicker
                  showTime={false}
                  value={form.start}
                  onChange={(v) => setForm((f) => ({ ...f, start: v }))}
                  className="w-[180px]"
                  placeholder={t('startField')}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">{t('endField')}</label>
                <DateTimePicker
                  showTime={false}
                  value={form.end}
                  onChange={(v) => setForm((f) => ({ ...f, end: v }))}
                  className="w-[180px]"
                  placeholder={t('endField')}
                />
              </div>
              <Button onClick={submit} disabled={saving}>
                <Plus className="mr-2 h-4 w-4" />
                {form.id ? t('save') : t('add')}
              </Button>
              {form.id && (
                <Button variant="ghost" onClick={resetForm} disabled={saving}>{t('cancel')}</Button>
              )}
            </CardContent>
          </Card>

          {/* List */}
          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner size="lg" className="text-primary" /></div>
          ) : semesters.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('empty')}</p>
          ) : (
            <Card>
              <CardContent className="divide-y p-0">
                {semesters.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <div className="flex items-center gap-2 font-medium">
                        {s.label}
                        {s.championsAwarded && (
                          <Badge variant="secondary" className="gap-1">
                            <Trophy className="h-3 w-3" /> {t('crowned')}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {toDateInput(s.startsAtUtc)} → {toDateInput(s.endsAtUtc)}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => edit(s)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => remove(s)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
