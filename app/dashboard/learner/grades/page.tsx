'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  getFeedbackByLearnerEmail,
  type DBFeedback,
  type DBHomework,
} from '@/lib/db';

type GradeRow = DBFeedback & { homework: DBHomework };

function getGradeLabel(grade: string): string {
  const n = parseFloat(grade);
  if (isNaN(n)) return grade; // letter grade like 'A' — return as-is
  if (n >= 90) return 'A';
  if (n >= 80) return 'B';
  if (n >= 70) return 'C';
  if (n >= 60) return 'D';
  return 'F';
}

function getGradeColor(grade: string): string {
  const label = getGradeLabel(grade);
  switch (label) {
    case 'A': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'B': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'C': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'D': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    default:  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  }
}

export default function LearnerGradesPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [grades, setGrades] = useState<GradeRow[]>([]);
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
      const data = await getFeedbackByLearnerEmail(user.email);
      setGrades(data);
    } finally {
      setLoading(false);
    }
  }

  if (!user || user.role !== 'learner') return null;

  // Compute summary stats from numeric grades only
  const numericGrades = grades
    .map((g) => parseFloat(g.grade ?? ''))
    .filter((n) => !isNaN(n));

  const avg = numericGrades.length > 0
    ? (numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length).toFixed(1)
    : '—';
  const highest = numericGrades.length > 0 ? Math.max(...numericGrades) : null;
  const lowest = numericGrades.length > 0 ? Math.min(...numericGrades) : null;

  return (
    <>
      <DashboardHeader
        title="My Grades"
        description="View your grades and teacher feedback"
      />

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Graded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : grades.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : numericGrades.length > 0 ? `${avg}%` : avg}</div>
            <p className="text-xs text-muted-foreground mt-1">Numeric grades only</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Highest Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '—' : highest !== null ? `${highest}%` : '—'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Best performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Lowest Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '—' : lowest !== null ? `${lowest}%` : '—'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Lowest score</p>
          </CardContent>
        </Card>
      </div>

      {/* Grades List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : grades.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              No grades yet. Keep submitting assignments to see your grades here!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {grades.map((grade) => {
            const label = getGradeLabel(grade.grade ?? '');
            const color = getGradeColor(grade.grade ?? '');
            const isNumeric = !isNaN(parseFloat(grade.grade ?? ''));

            return (
              <Card key={grade.feedbackId} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1 truncate">
                        {grade.homework?.homeworkTitle ?? 'Assignment'}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        Graded: {new Date(grade.createdAt).toLocaleDateString()}
                        {grade.teacher && (
                          <span className="ml-2">by {grade.teacher}</span>
                        )}
                      </p>

                      {grade.feedbackContent && (
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mt-2">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Teacher Feedback
                          </p>
                          <p className="text-sm">{grade.feedbackContent}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-3xl font-bold">
                          {grade.grade ?? '—'}
                          {isNumeric && <span className="text-lg text-muted-foreground">%</span>}
                        </div>
                        <Badge className={`${color} mt-2`}>{label}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}