'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { apiClient } from '@/lib/api';
import type { ProfessorAgent, ProfessorAgentToken } from '@/lib/types';
import { ExternalLink, Plus, Copy, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export default function ProfessorAgentPage() {
  const router = useRouter();
  const t = useTranslations('professorAgent');
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState<ProfessorAgent | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAgent();
  }, []);

  async function loadAgent() {
    try {
      setLoading(true);
      const agentData = await apiClient.getMyProfessorAgent();
      setAgent(agentData);
      setError(null);
    } catch (err: any) {
      if (err.message?.includes('404')) {
        // Agent doesn't exist yet - this is normal for professors without an agent
        setAgent(null);
        setError('no_agent');
      } else {
        console.error('Error loading professor agent:', err);
        setError('error');
        toast.error(t('tokens.createError'));
      }
    } finally {
      setLoading(false);
    }
  }

  async function createToken() {
    if (!agent) return;

    try {
      const newToken = await apiClient.createProfessorAgentToken(agent.id, {
        professorAgentId: agent.id,
        name: `Widget Token ${new Date().toLocaleDateString()}`,
        description: 'Professor feedback widget access',
        allowChat: true,
      });

      toast.success(t('tokens.createSuccess'));

      // Reload agent to get updated tokens list
      await loadAgent();

      // Copy token to clipboard
      await copyToken(newToken.token);
    } catch (err) {
      console.error('Error creating token:', err);
      toast.error(t('tokens.createError'));
    }
  }

  async function copyToken(token: string) {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(token);
      toast.success(t('tokens.copySuccess'));
      setTimeout(() => setCopied(null), 3000);
    } catch (err) {
      toast.error(t('tokens.copyError'));
    }
  }

  function openWidget(token: string) {
    const widgetUrl = process.env.NEXT_PUBLIC_WIDGET_URL || 'http://localhost:4321';
    const fullUrl = `${widgetUrl}/?professor_agent_token=${token}`;
    window.open(fullUrl, '_blank');
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
            <CardTitle>{t('title')}</CardTitle>
            <CardDescription>
              {t('description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                {t('noAgent.message')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('noAgent.adminOnly')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{t('title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{t('tokens.createError')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Agent Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>{agent.name}</CardTitle>
            <CardDescription>{agent.description || t('description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <span className="text-sm font-medium">{t('agentInfo.language')}</span>
                <span className="ml-2 text-sm text-muted-foreground">
                  {agent.tutorLanguage === 'pt-br' ? t('agentInfo.languagePortuguese') : agent.tutorLanguage === 'en' ? t('agentInfo.languageEnglish') : t('agentInfo.languageSpanish')}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium">{t('agentInfo.aiModel')}</span>
                <span className="ml-2 text-sm text-muted-foreground">
                  {agent.aiModelDisplayName || t('agentInfo.defaultModel')}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium">{t('agentInfo.status')}</span>
                <span className={`ml-2 text-sm ${agent.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {agent.isActive ? t('agentInfo.active') : t('agentInfo.inactive')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Access Tokens Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('tokens.title')}</CardTitle>
                <CardDescription>{t('tokens.description')}</CardDescription>
              </div>
              <Button onClick={createToken} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                {t('tokens.newButton')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!agent.tokensCount || agent.tokensCount === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t('tokens.noTokens')}
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {t('tokens.clickToAccess')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('howToUse.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>{t('howToUse.step1')}</p>
            <p>{t('howToUse.step2')}</p>
            <p>{t('howToUse.step3')}</p>
            <p>{t('howToUse.step4')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
