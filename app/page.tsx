'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, FileText, BarChart3 } from 'lucide-react';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">JustSpeak</span>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => router.push('/auth/login')}>
              Sign In
            </Button>
            <Button onClick={() => router.push('/auth/signup')}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
            Streamline Your Classroom
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
            JustSpeak makes homework management simple. Teachers create assignments, students submit work, and grades are delivered instantly.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => router.push('/auth/signup?role=teacher')}>
              I'm a Teacher
            </Button>
            <Button variant="outline" size="lg" onClick={() => router.push('/auth/signup?role=learner')}>
              I'm a Student
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-4 gap-8 mt-20">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Manage Assignments</h3>
            <p className="text-sm text-muted-foreground">
              Create, publish, and organize assignments with due dates and rubrics.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Student Management</h3>
            <p className="text-sm text-muted-foreground">
              Organize students by class and track their progress easily.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Submission Tracking</h3>
            <p className="text-sm text-muted-foreground">
              Easily see what students have submitted and grade their work.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Analytics & Insights</h3>
            <p className="text-sm text-muted-foreground">
              View class performance and student progress with detailed analytics.
            </p>
          </div>
        </div>
      </main>

    </div>
  );
}
