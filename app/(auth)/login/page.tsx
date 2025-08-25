import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <LoginForm />
    </div>
  );
}

export const metadata = {
  title: 'Login - Tutoria',
  description: 'Sign in to your Tutoria account',
};