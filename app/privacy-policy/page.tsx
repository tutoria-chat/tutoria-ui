'use client';

import { useTranslations } from 'next-intl';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function PrivacyPolicyPage() {
  const t = useTranslations('privacyPolicy');
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold">{t('title')}</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <p className="text-sm text-muted-foreground mb-8">{t('lastUpdated')}</p>

        {/* Section 1: Introduction */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">{t('intro.title')}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{t('intro.content')}</p>
        </section>

        {/* Section 2: Data We Collect */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">{t('dataCollected.title')}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">{t('dataCollected.description')}</p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1.5 ml-2">
            <li>{t('dataCollected.item1')}</li>
            <li>{t('dataCollected.item2')}</li>
            <li>{t('dataCollected.item3')}</li>
            <li>{t('dataCollected.item4')}</li>
            <li>{t('dataCollected.item5')}</li>
          </ul>
        </section>

        {/* Section 3: How We Use Data */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">{t('dataUsage.title')}</h2>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1.5 ml-2">
            <li>{t('dataUsage.item1')}</li>
            <li>{t('dataUsage.item2')}</li>
            <li>{t('dataUsage.item3')}</li>
            <li>{t('dataUsage.item4')}</li>
          </ul>
        </section>

        {/* Section 4: AI & Cross-Border Transfer */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">{t('aiProcessing.title')}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">{t('aiProcessing.content')}</p>
          <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-2">{t('aiProcessing.disclosureTitle')}</p>
            <p className="leading-relaxed">{t('aiProcessing.disclosureContent')}</p>
          </div>
        </section>

        {/* Section 5: Your Rights */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">{t('rights.title')}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">{t('rights.description')}</p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1.5 ml-2">
            <li>{t('rights.item1')}</li>
            <li>{t('rights.item2')}</li>
            <li>{t('rights.item3')}</li>
            <li>{t('rights.item4')}</li>
            <li>{t('rights.item5')}</li>
          </ul>
        </section>

        {/* Section 6: Data Retention */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">{t('retention.title')}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{t('retention.content')}</p>
        </section>

        {/* Section 7: Contact */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">{t('contact.title')}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{t('contact.content')}</p>
        </section>
      </div>
    </div>
  );
}
