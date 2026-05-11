'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { apiClient } from '@/lib/api';
import type { ProfessorAgent, ProfessorAgentToken, ProfessorAgentFile } from '@/lib/types';
import { ExternalLink, Plus, Copy, Check, Bot, Key, Info, Upload, Trash2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { formatDateShort } from '@/lib/utils';

export default function ProfessorAgentPage() {
  const t = useTranslations('professorAgent');
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState<ProfessorAgent | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creatingToken, setCreatingToken] = useState(false);
  const [agentFiles, setAgentFiles] = useState<ProfessorAgentFile[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAgent();
  }, []);

  async function loadAgent() {
    try {
      setLoading(true);
      const agentData = await apiClient.getMyProfessorAgent();
      setAgent(agentData);
      setError(null);
      const files = await apiClient.getProfessorAgentFiles(agentData.id);
      setAgentFiles(files);
    } catch (err: any) {
      if (err.message?.includes('404')) {
        setAgent(null);
        setError('no_agent');
      } else {
        console.error('Error loading professor agent:', err);
        setError('error');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!agent || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('File', file);
      const created = await apiClient.uploadProfessorAgentFile(agent.id, formData);
      setAgentFiles(prev => [created, ...prev]);
      toast.success(t('files.uploadSuccess'));
    } catch (err) {
      console.error('Error uploading file:', err);
      toast.error(t('files.uploadError'));
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDeleteFile(fileId: number) {
    if (!agent) return;
    setDeletingFileId(fileId);
    try {
      await apiClient.deleteProfessorAgentFile(agent.id, fileId);
      setAgentFiles(prev => prev.filter(f => f.id !== fileId));
      toast.success(t('files.deleteSuccess'));
    } catch (err) {
      console.error('Error deleting file:', err);
      toast.error(t('files.deleteError'));
    } finally {
      setDeletingFileId(null);
    }
  }

  function formatFileSize(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function createToken() {
    if (!agent) return;
    setCreatingToken(true);
    try {
      const newToken = await apiClient.createProfessorAgentToken(agent.id, {
        professorAgentId: agent.id,
        name: `Token ${new Date().toLocaleDateString()}`,
        description: 'Professor feedback widget access',
        allowChat: true,
      });

      toast.success(t('tokens.createSuccess'));
      await loadAgent();
      await copyToClipboard(newToken.token);
    } catch (err) {
      console.error('Error creating token:', err);
      toast.error(t('tokens.createError'));
    } finally {
      setCreatingToken(false);
    }
  }

  async function copyToClipboard(token: string) {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(token);
      toast.success(t('tokens.copySuccess'));
      setTimeout(() => setCopied(null), 3000);
    } catch {
      toast.error(t('tokens.copyError'));
    }
  }

  function openWidget(token: string) {
    const widgetUrl = process.env.NEXT_PUBLIC_WIDGET_URL || 'http://localhost:4321';
    window.open(`${widgetUrl}/?professor_agent_token=${token}`, '_blank');
  }

  function getWidgetUrl(token: string) {
    const widgetUrl = process.env.NEXT_PUBLIC_WIDGET_URL || 'http://localhost:4321';
    return `${widgetUrl}/?professor_agent_token=${token}`;
  }

  function getLanguageLabel(lang: string) {
    if (lang === 'pt-br') return t('agentInfo.languagePortuguese');
    if (lang === 'en') return t('agentInfo.languageEnglish');
    return t('agentInfo.languageSpanish');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="xl" className="text-primary" />
      </div>
    );
  }

  if (error === 'no_agent') {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>{t('title')}</CardTitle>
                <CardDescription>{t('description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed p-8 text-center space-y-2">
              <Bot className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">{t('noAgent.message')}</p>
              <p className="text-sm text-muted-foreground">{t('noAgent.adminOnly')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!agent) return null;

  const tokens: ProfessorAgentToken[] = agent.tokens ?? [];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Agent Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>{agent.name}</CardTitle>
                <CardDescription>{agent.description || t('description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t('agentInfo.language')}
                </span>
                <span>{getLanguageLabel(agent.tutorLanguage)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t('agentInfo.aiModel')}
                </span>
                <span>{agent.aiModelDisplayName || t('agentInfo.defaultModel')}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t('agentInfo.status')}
                </span>
                <Badge variant={agent.isActive ? 'default' : 'secondary'} className="w-fit">
                  {agent.isActive ? t('agentInfo.active') : t('agentInfo.inactive')}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Access Tokens */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                  <Key className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle>{t('tokens.title')}</CardTitle>
                  <CardDescription>{t('tokens.description')}</CardDescription>
                </div>
              </div>
              <Button onClick={createToken} size="sm" disabled={creatingToken}>
                {creatingToken ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {t('tokens.newButton')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {tokens.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <Key className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t('tokens.noTokens')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tokens.map((tok) => {
                  const isExpired = tok.isExpired;
                  const widgetUrl = getWidgetUrl(tok.token);
                  return (
                    <div
                      key={tok.id}
                      className={`rounded-lg border p-4 space-y-3 ${isExpired ? 'opacity-60 bg-muted/30' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{tok.name}</span>
                            {isExpired && (
                              <Badge variant="destructive" className="text-xs">
                                {t('tokens.expired')}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {t('tokens.createdAt')}: {formatDateShort(tok.createdAt)}
                            {tok.expiresAt && (
                              <span className="ml-3">
                                {t('tokens.expires')}: {formatDateShort(tok.expiresAt)}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(tok.token)}
                            title={t('tokens.copy')}
                          >
                            {copied === tok.token ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openWidget(tok.token)}
                            disabled={isExpired}
                          >
                            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                            {t('tokens.openWidget')}
                          </Button>
                        </div>
                      </div>
                      <div className="rounded bg-muted/50 px-3 py-1.5">
                        <p className="text-xs font-mono text-muted-foreground truncate">{widgetUrl}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agent Files */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle>{t('files.title')}</CardTitle>
                  <CardDescription>{t('files.description')}</CardDescription>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
              >
                {uploadingFile ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {t('files.uploadButton')}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.txt,.docx,.doc,.pptx,.ppt,.xlsx,.xls"
                onChange={handleFileUpload}
              />
            </div>
          </CardHeader>
          <CardContent>
            {agentFiles.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t('files.noFiles')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {agentFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {file.fileType.toUpperCase()}
                          {file.fileSize ? ` · ${formatFileSize(file.fileSize)}` : ''}
                          {file.processingStatus === 'pending' && (
                            <span className="ml-2 text-amber-500">{t('files.processing')}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFile(file.id)}
                      disabled={deletingFileId === file.id}
                      className="text-destructive hover:text-destructive shrink-0"
                    >
                      {deletingFileId === file.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* How to use */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">{t('howToUse.title')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm text-muted-foreground list-none">
              <li>{t('howToUse.step1')}</li>
              <li>{t('howToUse.step2')}</li>
              <li>{t('howToUse.step3')}</li>
              <li>{t('howToUse.step4')}</li>
            </ol>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
