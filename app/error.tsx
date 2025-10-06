'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Home, RefreshCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Error boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl">Algo deu errado!</CardTitle>
          <CardDescription>
            Ocorreu um erro inesperado. Tente novamente ou volte para a página inicial.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && (
            <div className="p-4 bg-muted rounded-md">
              <p className="text-xs font-mono text-muted-foreground break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs font-mono text-muted-foreground mt-2">
                  ID: {error.digest}
                </p>
              )}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={reset}
              className="flex-1"
              variant="default"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              className="flex-1"
              variant="outline"
            >
              <Home className="mr-2 h-4 w-4" />
              Página Inicial
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
