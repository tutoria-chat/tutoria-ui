'use client';

import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Fallback UI with translations
 */
function ErrorFallback({ error, onReset, onGoHome }: { error: Error | null; onReset: () => void; onGoHome: () => void }) {
  const t = useTranslations('common.errorBoundary');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertCircle className="mr-2 h-5 w-5" />
            {t('title')}
          </CardTitle>
          <CardDescription>
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && error && (
            <div className="p-4 bg-muted rounded-md">
              <p className="text-sm font-mono text-destructive">
                {error.message}
              </p>
              {error.stack && (
                <pre className="mt-2 text-xs overflow-auto max-h-40">
                  {error.stack}
                </pre>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={onReset} variant="outline" className="flex-1">
              <RefreshCcw className="mr-2 h-4 w-4" />
              {t('tryAgain')}
            </Button>
            <Button onClick={onGoHome} className="flex-1">
              <Home className="mr-2 h-4 w-4" />
              {t('goHome')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Error Boundary component to catch React rendering errors
 * Provides a user-friendly error UI with retry and navigation options
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
          onGoHome={this.handleGoHome}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Lightweight error boundary for sections/cards
 * Shows error UI within the section instead of full screen
 */
export function SectionErrorBoundary({
  children,
  title,
  description
}: {
  children: ReactNode;
  title?: string;
  description?: string;
}) {
  const t = useTranslations('common.errorBoundary');

  return (
    <ErrorBoundary
      fallback={
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive text-base">
                {title || t('sectionTitle')}
              </CardTitle>
            </div>
            <CardDescription>{description || t('sectionDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              {t('reloadPage')}
            </Button>
          </CardContent>
        </Card>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
