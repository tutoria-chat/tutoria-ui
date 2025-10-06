import { useRouter as useNextRouter } from 'next/navigation';
import { toast } from 'sonner';

export function useSafeRouter() {
  const router = useNextRouter();

  const safePush = async (href: string) => {
    try {
      router.push(href);
    } catch (error) {
      console.error('Navigation error:', error);
      toast.error('Erro de navegação', {
        description: 'Não foi possível navegar para a página solicitada.',
      });
    }
  };

  const safeReplace = async (href: string) => {
    try {
      router.replace(href);
    } catch (error) {
      console.error('Navigation error:', error);
      toast.error('Erro de navegação', {
        description: 'Não foi possível navegar para a página solicitada.',
      });
    }
  };

  const safeBack = () => {
    try {
      router.back();
    } catch (error) {
      console.error('Navigation error:', error);
      toast.error('Erro de navegação', {
        description: 'Não foi possível voltar para a página anterior.',
      });
      // Fallback to home
      router.push('/');
    }
  };

  return {
    ...router,
    push: safePush,
    replace: safeReplace,
    back: safeBack,
  };
}
