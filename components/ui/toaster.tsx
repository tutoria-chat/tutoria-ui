'use client';

import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        classNames: {
          toast: 'group toast bg-background text-foreground border-border shadow-lg',
          description: 'text-muted-foreground',
          actionButton: 'bg-primary text-primary-foreground',
          cancelButton: 'bg-muted text-muted-foreground',
          error: 'bg-destructive text-destructive-foreground border-destructive',
          success: 'bg-green-600 text-white border-green-600',
          warning: 'bg-yellow-600 text-white border-yellow-600',
          info: 'bg-blue-600 text-white border-blue-600',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
