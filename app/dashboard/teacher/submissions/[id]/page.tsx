'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  getHomeworkById,
  getFeedbackForHomework,
  createFeedback,
  updateFeedback,
  type DBHomework,
  type DBFeedback,
} from '@/lib/db';
import { ChevronLeft, Save, ExternalLink, Paperclip } from 'lucide-react';
import Link from 'next/link';

export default function SubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [submission, setSubmission] = useState<DBHomework | null>(null);
  const [existingFeedback, setExistingFeedback] = useState<DBFeedback | null>(null);
  const [loading, setLoading] = useState(true);

  // Grading form
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    load();
  }, [user, id]);

  async function load() {
    try {
      const numericId = parseInt(id);
      const [sub, fb] = await Promise.all([
        getHomeworkById(numericId),
        getFeedbackForHomework(numericId),
      ]);

      setSubmission(sub);
      setExistingFeedback(fb);

      // Pre-fill form if already graded
      if (fb) {
        setGrade(fb.grade ?? '');
        setFeedback(fb.feedbackContent ?? '');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveGrade(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !submission) return;

    if (!grade.trim()) {
      setSaveError('Please enter a grade.');
      return;
    }

    setSaveError('');
    setSaving(true);

    try {
      if (existingFeedback) {
        // Update existing feedback
        const updated = await updateFeedback(existingFeedback.feedbackId, {
          grade: grade.trim(),
          feedbackContent: feedback.trim(),
        });
        setExistingFeedback(updated);
      } else {
        // Create new feedback
        const created = await createFeedback({
          homeworkId: submission.homeworkId,
          grade: grade.trim(),
          feedbackContent: feedback.trim(),
          teacher: user.name,
        });
        setExistingFeedback(created);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save grade.');
    } finally {
      setSaving(false);
    }
  }

  if (!user || user.role !== 'teacher') return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/teacher/submissions">
          <Button variant="ghost" className="gap-2">
            <ChevronLeft className="w-4 h-4" />
            Back to Submissions
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">Submission not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isGraded = !!existingFeedback;

  return (
    <>
      <div className="mb-6">
        <Link href="/dashboard/teacher/submissions">
          <Button variant="ghost" className="mb-4 gap-2">
            <ChevronLeft className="w-4 h-4" />
            Back to Submissions
          </Button>
        </Link>
        <DashboardHeader
          title={`Grading: ${submission.homeworkTitle}`}
          description={`${submission.submittedBy} · ${submission.email}`}
        />
      </div>

      <div className="grid md:grid-cols-3 gap-6">

        {/* Left: Submission content */}
        <div className="md:col-span-2 space-y-6">

          {/* Meta */}
          <Card>
            <CardHeader>
              <CardTitle>Submission Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-24">Student</span>
                <span className="font-medium">{submission.submittedBy}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-24">Email</span>
                <span className="text-sm">{submission.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-24">Submitted</span>
                <span className="text-sm">{new Date(submission.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-24">Status</span>
                {isGraded ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Graded
                  </Badge>
                ) : (
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Pending Review
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Written answer */}
          <Card>
            <CardHeader>
              <CardTitle>Written Answer</CardTitle>
            </CardHeader>
            <CardContent>
              {submission.homeworkContent ? (
                <div className="bg-muted/50 p-4 rounded-lg border border-border">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {submission.homeworkContent}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No written answer provided.</p>
              )}
            </CardContent>
          </Card>

          {/* Attachment */}
          {submission.fileUrl && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Attachment</CardTitle>
                <a
                  href={submission.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={submission.fileName ?? true}
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open / Download
                </a>
              </CardHeader>
              <CardContent>
                {/* PDF — inline iframe viewer */}
                {submission.fileName?.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={submission.fileUrl}
                    className="w-full rounded-lg border border-border"
                    style={{ height: '600px' }}
                    title={submission.fileName}
                  />
                ) : submission.fileName?.match(/\.(jpe?g|png|gif|webp)$/i) ? (
                  /* Image — inline preview */
                  <img
                    src={submission.fileUrl}
                    alt={submission.fileName}
                    className="w-full rounded-lg border border-border object-contain max-h-[600px]"
                  />
                ) : (
                  /* Other file types — download link */
                  <a
                    href={submission.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
                  >
                    <Paperclip className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{submission.fileName ?? 'Download attachment'}</p>
                      <p className="text-xs text-muted-foreground">Click to download</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </a>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Grading panel */}
        <div>
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle className="text-lg">
                {isGraded ? 'Update Grade' : 'Grade Submission'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveGrade} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="grade">
                    Grade
                    <span className="text-xs text-muted-foreground ml-1">(e.g. A, 85%, 42/50)</span>
                  </Label>
                  <Input
                    id="grade"
                    placeholder="e.g. A, 85%, 42/50"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedback">Feedback</Label>
                  <Textarea
                    id="feedback"
                    placeholder="Write feedback for the student..."
                    rows={6}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    disabled={saving}
                  />
                </div>

                {saveError && (
                  <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
                )}

                {saved && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Grade saved successfully.
                  </p>
                )}

                <Button type="submit" className="w-full gap-2" disabled={saving}>
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : isGraded ? 'Update Grade' : 'Submit Grade'}
                </Button>
              </form>

              {/* Current grade summary if already graded */}
              {isGraded && existingFeedback && (
                <div className="mt-6 pt-6 border-t border-border space-y-3">
                  <div>
                    <span className="text-xs text-muted-foreground">Current Grade</span>
                    <p className="text-3xl font-bold mt-1">{existingFeedback.grade}</p>
                  </div>
                  {existingFeedback.feedbackContent && (
                    <div>
                      <span className="text-xs text-muted-foreground">Current Feedback</span>
                      <p className="text-sm mt-1 text-muted-foreground">
                        {existingFeedback.feedbackContent}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}