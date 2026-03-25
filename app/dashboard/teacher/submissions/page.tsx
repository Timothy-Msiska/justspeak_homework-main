'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getClassroomsByTeacher,
  getAllSubmissionsForClass,
  getSubmissionsForHomework,
  getFeedbackForHomework,
  type DBHomework,
  type DBClassroom,
} from '@/lib/db';
import { Eye, Paperclip } from 'lucide-react';
import Link from 'next/link';

interface SubmissionRow extends DBHomework {
  isGraded: boolean;
  grade?: string;
  className: string;
}

export default function SubmissionsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  // Optional filters set by the assignments page "View Submissions" button
  const filterHomework = searchParams.get('homework');
  const filterClass = searchParams.get('class');

  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'graded'>('all');

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  async function load() {
    if (!user) return;
    try {
      const classrooms = await getClassroomsByTeacher(user.id);
      const all: SubmissionRow[] = [];

      await Promise.all(
        classrooms.map(async (cls: DBClassroom) => {
          // If coming from assignments page, only show that homework's submissions
          const subs = filterClass === cls.accessCode && filterHomework
            ? await getSubmissionsForHomework(cls.accessCode, filterHomework)
            : await getAllSubmissionsForClass(cls.accessCode);

          // Check grading status for each submission
          await Promise.all(
            subs.map(async (sub: DBHomework) => {
              const fb = await getFeedbackForHomework(sub.homeworkId);
              all.push({
                ...sub,
                isGraded: !!fb,
                grade: fb?.grade ?? undefined,
                className: cls.className,
              });
            })
          );
        })
      );

      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSubmissions(all);
    } finally {
      setLoading(false);
    }
  }

  if (!user || user.role !== 'teacher') return null;

  const filtered = submissions.filter((s) => {
    if (filter === 'pending') return !s.isGraded;
    if (filter === 'graded') return s.isGraded;
    return true;
  });

  const pendingCount = submissions.filter((s) => !s.isGraded).length;
  const gradedCount = submissions.filter((s) => s.isGraded).length;

  return (
    <>
      <DashboardHeader
        title={filterHomework ? `Submissions: ${filterHomework}` : 'Student Submissions'}
        description="Review and grade submitted assignments"
      />

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>
          All ({submissions.length})
        </Button>
        <Button variant={filter === 'pending' ? 'default' : 'outline'} onClick={() => setFilter('pending')}>
          Pending ({pendingCount})
        </Button>
        <Button variant={filter === 'graded' ? 'default' : 'outline'} onClick={() => setFilter('graded')}>
          Graded ({gradedCount})
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              {filter === 'all' && 'No submissions yet.'}
              {filter === 'pending' && 'No pending submissions — all caught up!'}
              {filter === 'graded' && 'No graded submissions yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((sub) => (
            <Card key={sub.homeworkId} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="font-semibold truncate">{sub.homeworkTitle}</h3>
                      <Badge variant="outline">{sub.className}</Badge>
                      {sub.isGraded ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Graded
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          Pending
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Submitted by:{' '}
                      <span className="font-medium text-foreground">{sub.submittedBy}</span>
                      {' · '}
                      {sub.email}
                    </p>

                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span>{new Date(sub.createdAt).toLocaleString()}</span>
                      {sub.fileName && (
                        <span className="flex items-center gap-1">
                          <Paperclip className="w-3 h-3" />
                          {sub.fileName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    {sub.isGraded && sub.grade && (
                      <span className="text-2xl font-bold">{sub.grade}</span>
                    )}
                    <Link href={`/dashboard/teacher/submissions/${sub.homeworkId}`}>
                      <Button size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                        {sub.isGraded ? 'Review' : 'Grade'}
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}