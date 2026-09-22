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
          success: 'bg-green-700 text-white border-green-700',
          warning: 'bg-yellow-800 text-white border-yellow-800',
          info: 'bg-blue-700 text-white border-blue-700',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
