import { LoginForm } from '@/components/auth/login-form';
import { BookOpen } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">JustSpeak</h1>
        </div>
        <p className="text-muted-foreground">Homework Management Platform</p>
      </div>

      <LoginForm />
    </div>
  );
}
