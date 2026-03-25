'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getClassroomByAccessCode, updateUserClass } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertCircle, BookOpen } from 'lucide-react';

export default function JoinClassPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      // Look up the classroom by access code
      const classroom = await getClassroomByAccessCode(accessCode.trim().toUpperCase());

      if (!classroom) {
        setError('Class not found. Check the access code and try again.');
        return;
      }

      // Save the class to the learner's profile
      await updateUserClass(user.id, classroom.classId);

      // Redirect to dashboard — it will now load homework for this class
      router.push('/dashboard/learner');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl">JustSpeak</span>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Join a Class</CardTitle>
            <CardDescription>
              Enter the access code given to you by your teacher
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleJoin} className="space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg p-3 flex gap-2 text-sm text-red-700 dark:text-red-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="accessCode">Class Access Code</Label>
                <Input
                  id="accessCode"
                  type="text"
                  placeholder="e.g. ENG101"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  disabled={loading}
                  className="text-center text-lg font-mono tracking-widest uppercase"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading || !accessCode}>
                {loading ? 'Joining...' : 'Join Class'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}