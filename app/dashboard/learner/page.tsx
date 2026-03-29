'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getHomeworkByClass,
  getSubmissionsByLearner,
  getFeedbackByLearnerEmail,
  getClassroomById,
  type DBHomework,
  type DBFeedback,
  type DBClassroom,
} from '@/lib/db';
import Link from 'next/link';
import { FileText, CheckCircle, BarChart3, Clock } from 'lucide-react';

type FeedbackRow = DBFeedback & { homework: DBHomework };

export default function LearnerDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  const [classroom, setClassroom] = useState<DBClassroom | null>(null);
  const [homework, setHomework] = useState<DBHomework[]>([]);
  const [submissions, setSubmissions] = useState<DBHomework[]>([]);
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (!user.current_class_id) {
      router.push('/dashboard/learner/join');
      return;
    }
    load();
  }, [user, router]);

  async function load() {
    if (!user) return;
    try {
      const [cls, hw, subs, fb] = await Promise.all([
        getClassroomById(user.current_class_id!),
        getHomeworkByClass(user.current_class_id!),
        getSubmissionsByLearner(user.email),
        getFeedbackByLearnerEmail(user.email),
      ]);

      setClassroom(cls);
      setHomework(hw);
      setSubmissions(subs);
      setFeedback(fb);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (!user || user.role !== 'learner') return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Derive stats
  const submittedTitles = new Set(submissions.map((s) => s.homeworkTitle));
  const pending = homework.filter((h) => !submittedTitles.has(h.homeworkTitle));
  const gradedCount = feedback.length;

  const numericGrades = feedback
    .map((f) => parseFloat(f.grade ?? ''))
    .filter((n) => !isNaN(n));
  const avgGrade = numericGrades.length > 0
    ? (numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length).toFixed(1) + '%'
    : feedback.length > 0 ? '—' : '—';

  return (
    <>
      <DashboardHeader
        title={`Welcome, ${user.name.split(' ')[0]}!`}
        description={classroom ? `Class: ${classroom.className} · ${classroom.accessCode}` : 'Track your assignments and grades'}
      >
        <Link href="/dashboard/learner/assignments">
          <Button>Browse Assignments</Button>
        </Link>
      </DashboardHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pending.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Not yet submitted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Work submitted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Graded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gradedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">With feedback</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgGrade}</div>
            <p className="text-xs text-muted-foreground mt-1">Numeric grades only</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Assignments + Recent Grades */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Pending */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Pending Assignments
            </CardTitle>
            <CardDescription>Assignments awaiting your submission</CardDescription>
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {homework.length === 0
                  ? 'No assignments posted yet.'
                  : 'All caught up — great job!'}
              </p>
            ) : (
              <div className="space-y-3">
                {pending.slice(0, 3).map((hw) => (
                  <div
                    key={hw.homeworkId}
                    className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-medium text-sm flex-1 truncate">{hw.homeworkTitle}</h4>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {hw.homeworkContent}
                    </p>
                    <Link href={`/dashboard/learner/assignments?submit=${hw.homeworkId}`}>
                      <Button size="sm" variant="ghost" className="mt-2">
                        Submit
                      </Button>
                    </Link>
                  </div>
                ))}
                {pending.length > 3 && (
                  <Link href="/dashboard/learner/assignments">
                    <p className="text-xs text-primary hover:underline text-center pt-1">
                      View all {pending.length} pending
                    </p>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Grades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Recent Grades
            </CardTitle>
            <CardDescription>Your latest feedback from teachers</CardDescription>
          </CardHeader>
          <CardContent>
            {feedback.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No grades yet. Submit assignments to get feedback!
              </p>
            ) : (
              <div className="space-y-3">
                {feedback.slice(0, 3).map((f) => (
                  <div
                    key={f.feedbackId}
                    className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm truncate flex-1">
                        {f.homework?.homeworkTitle ?? 'Assignment'}
                      </h4>
                      <span className="text-xl font-bold ml-2">{f.grade ?? '—'}</span>
                    </div>
                    {f.feedbackContent && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {f.feedbackContent}
                      </p>
                    )}
                  </div>
                ))}
                {feedback.length > 3 && (
                  <Link href="/dashboard/learner/grades">
                    <p className="text-xs text-primary hover:underline text-center pt-1">
                      View all {feedback.length} grades
                    </p>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <Link href="/dashboard/learner/assignments">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="w-4 h-4" />
                Browse Assignments
              </CardTitle>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/learner/submissions">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle className="w-4 h-4" />
                My Submissions
              </CardTitle>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/learner/grades">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="w-4 h-4" />
                View Grades
              </CardTitle>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </>
  );
}