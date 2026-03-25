'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  getHomeworkByClass,
  getSubmissionsByLearner,
  getClassroomById,
  submitHomework,
  type DBHomework,
  type DBClassroom,
} from '@/lib/db';
import { supabase } from '@/lib/firebase';
import { Eye, Send, Paperclip, X, FileText, AlertCircle } from 'lucide-react';

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
];
const MAX_SIZE_MB = 10;
const BUCKET = 'submissions'; // your Supabase Storage bucket name

export default function LearnerAssignmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [homework, setHomework] = useState<DBHomework[]>([]);
  const [submissions, setSubmissions] = useState<DBHomework[]>([]);
  const [classroom, setClassroom] = useState<DBClassroom | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted'>('all');

  // Submit dialog
  const [selected, setSelected] = useState<DBHomework | null>(null);
  const [answer, setAnswer] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const [cls, hw, subs] = await Promise.all([
        getClassroomById(user.current_class_id!),
        getHomeworkByClass(user.current_class_id!),
        getSubmissionsByLearner(user.email),
      ]);
      setClassroom(cls);
      setHomework(hw);
      setSubmissions(subs);

      const submitId = searchParams.get('submit');
      if (submitId) {
        const match = hw.find((h) => h.homeworkId === parseInt(submitId));
        if (match) openDialog(match);
      }
    } finally {
      setLoading(false);
    }
  }

  function openDialog(hw: DBHomework) {
    setSelected(hw);
    setAnswer('');
    setFile(null);
    setFileError('');
    setSubmitError('');
  }

  function closeDialog() {
    if (submitting || uploading) return;
    setSelected(null);
    setAnswer('');
    setFile(null);
    setFileError('');
    setSubmitError('');
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null;
    setFileError('');

    if (!picked) { setFile(null); return; }

    if (!ACCEPTED_TYPES.includes(picked.type)) {
      setFileError('Unsupported file type. Please upload a PDF, Word doc, image, or text file.');
      setFile(null);
      return;
    }

    if (picked.size > MAX_SIZE_MB * 1024 * 1024) {
      setFileError(`File is too large. Maximum size is ${MAX_SIZE_MB}MB.`);
      setFile(null);
      return;
    }

    setFile(picked);
  }

  async function uploadToSupabase(file: File, homeworkId: number): Promise<{ url: string; name: string }> {
    // Path: submissions/{userId}/{homeworkId}/{timestamp}_{filename}
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${user!.id}/${homeworkId}/${Date.now()}_${safeName}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: false });

    if (error) throw new Error(`Upload failed: ${error.message}`);

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return { url: data.publicUrl, name: file.name };
  }

  async function handleSubmit() {
    if (!selected || !user) return;

    if (!answer.trim() && !file) {
      setSubmitError('Please write an answer or attach a file before submitting.');
      return;
    }

    setSubmitError('');
    setSubmitting(true);

    try {
      let fileUrl: string | null = null;
      let fileName: string | null = null;

      if (file) {
        setUploading(true);
        const uploaded = await uploadToSupabase(file, selected.homeworkId);
        fileUrl = uploaded.url;
        fileName = uploaded.name;
        setUploading(false);
      }

      await submitHomework({
        accessCode: classroom!.accessCode,
        homeworkTitle: selected.homeworkTitle,
        homeworkContent: answer.trim(),
        submittedBy: user.name,
        email: user.email,
        fileUrl,
        fileName,
      });

      // Refresh submissions list
      const updated = await getSubmissionsByLearner(user.email);
      setSubmissions(updated);
      closeDialog();
    } catch (err) {
      setUploading(false);
      setSubmitError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!user || user.role !== 'learner') return null;

  const submittedTitles = new Set(submissions.map((s) => s.homeworkTitle));
  const filtered = homework.filter((hw) => {
    if (filter === 'pending') return !submittedTitles.has(hw.homeworkTitle);
    if (filter === 'submitted') return submittedTitles.has(hw.homeworkTitle);
    return true;
  });
  const pendingCount = homework.filter((h) => !submittedTitles.has(h.homeworkTitle)).length;
  const submittedCount = homework.filter((h) => submittedTitles.has(h.homeworkTitle)).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <>
      <DashboardHeader title="Assignments" description="Browse and submit your homework" />

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>
          All ({homework.length})
        </Button>
        <Button variant={filter === 'pending' ? 'default' : 'outline'} onClick={() => setFilter('pending')}>
          Pending ({pendingCount})
        </Button>
        <Button variant={filter === 'submitted' ? 'default' : 'outline'} onClick={() => setFilter('submitted')}>
          Submitted ({submittedCount})
        </Button>
      </div>

      {/* Assignment List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              {filter === 'all' && 'No assignments available yet.'}
              {filter === 'pending' && "No pending assignments — you're all caught up!"}
              {filter === 'submitted' && 'No submitted assignments yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((hw) => {
            const isSubmitted = submittedTitles.has(hw.homeworkTitle);
            return (
              <Card key={hw.homeworkId} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg truncate">{hw.homeworkTitle}</h3>
                        {isSubmitted ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Submitted
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{hw.homeworkContent}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Posted: {new Date(hw.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex-shrink-0">
                      {isSubmitted ? (
                        <Button variant="outline" size="sm" disabled>
                          <Eye className="w-4 h-4 mr-1" />
                          Submitted
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => openDialog(hw)}>
                          <Send className="w-4 h-4 mr-1" />
                          Submit
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Submit Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selected?.homeworkTitle}</DialogTitle>
            <DialogDescription className="whitespace-pre-wrap">
              {selected?.homeworkContent}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Text answer */}
            <div className="space-y-2">
              <Label htmlFor="answer">Your Answer</Label>
              <Textarea
                id="answer"
                placeholder="Type your answer here..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={6}
                disabled={submitting}
              />
            </div>

            {/* File attachment */}
            <div className="space-y-2">
              <Label>
                Attachment{' '}
                <span className="text-muted-foreground text-xs font-normal">
                  (optional — PDF, Word, image, up to 10MB)
                </span>
              </Label>

              {file ? (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/50">
                  <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setFileError('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    disabled={submitting}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-muted/50 transition-colors text-sm text-muted-foreground hover:text-foreground"
                >
                  <Paperclip className="w-4 h-4" />
                  Click to attach a file
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.txt"
                onChange={handleFileChange}
                className="hidden"
              />

              {fileError && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{fileError}</span>
                </div>
              )}
            </div>

            {/* Upload status */}
            {uploading && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary flex-shrink-0" />
                Uploading file...
              </div>
            )}

            {submitError && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={closeDialog} disabled={submitting}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || (!answer.trim() && !file)}
              >
                {uploading ? 'Uploading...' : submitting ? 'Submitting...' : 'Submit Assignment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}