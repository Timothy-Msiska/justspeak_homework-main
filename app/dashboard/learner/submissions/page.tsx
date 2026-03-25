'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  getSubmissionsByLearner,
  getFeedbackForHomework,
  type DBHomework,
  type DBFeedback,
} from '@/lib/db';
import Link from 'next/link';
import { Paperclip, ExternalLink } from 'lucide-react';

interface SubmissionRow extends DBHomework {
  feedback: DBFeedback | null;
}

export default function LearnerSubmissionsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
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
      const subs = await getSubmissionsByLearner(user.email);

      // Fetch feedback for each submission in parallel
      const rows = await Promise.all(
        subs.map(async (sub) => {
          const feedback = await getFeedbackForHomework(sub.homeworkId);
          return { ...sub, feedback };
        })
      );

      setSubmissions(rows);
    } finally {
      setLoading(false);
    }
  }

  if (!user || user.role !== 'learner') return null;

  const gradedCount = submissions.filter((s) => s.feedback).length;

  return (
    <>
      <DashboardHeader
        title="My Submissions"
        description="View your submitted assignments and feedback"
      />

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="font-semibold mb-2">No submissions yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Submit your assignments to track your progress here.
            </p>
            <Link href="/dashboard/learner/assignments">
              <Button>Browse Assignments</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary */}
          <div className="flex gap-6 mb-6 text-sm text-muted-foreground">
            <span>
              <strong className="text-foreground">{submissions.length}</strong> submitted
            </span>
            <span>
              <strong className="text-foreground">{gradedCount}</strong> graded
            </span>
            <span>
              <strong className="text-foreground">{submissions.length - gradedCount}</strong> pending
            </span>
          </div>

          <div className="space-y-4">
            {submissions.map((sub) => {
              const isGraded = !!sub.feedback;
              return (
                <Card key={sub.homeworkId} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Title + status */}
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="font-semibold text-lg truncate">{sub.homeworkTitle}</h3>
                          {isGraded ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Graded
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              Awaiting Grade
                            </Badge>
                          )}
                        </div>

                        {/* Submitted date */}
                        <p className="text-xs text-muted-foreground mb-3">
                          Submitted: {new Date(sub.createdAt).toLocaleString()}
                        </p>

                        {/* Written answer preview */}
                        {sub.homeworkContent && (
                          <div className="bg-muted/50 p-3 rounded-lg border border-border mb-3">
                            <p className="text-sm line-clamp-2 text-muted-foreground">
                              {sub.homeworkContent}
                            </p>
                          </div>
                        )}

                        {/* Attachment */}
                        {sub.fileUrl && (
                          <a
                            href={sub.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                          >
                            <Paperclip className="w-4 h-4" />
                            {sub.fileName ?? 'View attachment'}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}

                        {/* Feedback */}
                        {isGraded && sub.feedback && (
                          <div className="mt-3 pt-3 border-t border-border space-y-2">
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground">Grade</span>
                              <span className="text-xl font-bold">{sub.feedback.grade}</span>
                              {sub.feedback.teacher && (
                                <span className="text-xs text-muted-foreground">
                                  by {sub.feedback.teacher}
                                </span>
                              )}
                            </div>
                            {sub.feedback.feedbackContent && (
                              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                                <p className="text-xs text-muted-foreground mb-1 font-medium">
                                  Teacher Feedback
                                </p>
                                <p className="text-sm">{sub.feedback.feedbackContent}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}