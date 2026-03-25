'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getClassroomsByTeacher,
  createClassroom,
  createHomework,
  type DBClassroom,
} from '@/lib/db';
import { ChevronLeft, Plus, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function CreateAssignmentPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [classrooms, setClassrooms] = useState<DBClassroom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [loadingClassrooms, setLoadingClassrooms] = useState(true);

  // New classroom inline form
  const [showNewClass, setShowNewClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassDesc, setNewClassDesc] = useState('');
  const [newAccessCode, setNewAccessCode] = useState('');
  const [creatingClass, setCreatingClass] = useState(false);
  const [classError, setClassError] = useState('');

  // Assignment form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    loadClassrooms();
  }, [user]);

  async function loadClassrooms() {
    if (!user) return;
    try {
      const cls = await getClassroomsByTeacher(user.id);
      setClassrooms(cls);
      if (cls.length > 0) setSelectedClassId(cls[0].classId);
    } finally {
      setLoadingClassrooms(false);
    }
  }

  async function handleCreateClass(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setClassError('');

    if (!newClassName.trim()) return setClassError('Class name is required');
    if (!newAccessCode.trim()) return setClassError('Access code is required');

    setCreatingClass(true);
    try {
      const cls = await createClassroom({
        teacherId: user.id,
        className: newClassName.trim(),
        description: newClassDesc.trim() || undefined,
        accessCode: newAccessCode.trim().toUpperCase(),
      });

      setClassrooms((prev) => [cls, ...prev]);
      setSelectedClassId(cls.classId);
      setShowNewClass(false);
      setNewClassName('');
      setNewClassDesc('');
      setNewAccessCode('');
    } catch (err) {
      setClassError(err instanceof Error ? err.message : 'Failed to create class');
    } finally {
      setCreatingClass(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!content.trim()) newErrors.content = 'Assignment content is required';
    if (!selectedClassId) newErrors.class = 'Please select or create a class first';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitError('');
    setSubmitting(true);

    try {
      const classroom = classrooms.find((c) => c.classId === selectedClassId);
      if (!classroom) throw new Error('Classroom not found');

      await createHomework({
        accessCode: classroom.accessCode,
        homeworkTitle: title.trim(),
        homeworkContent: content.trim(),
      });

      router.push('/dashboard/teacher/assignments');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create assignment');
    } finally {
      setSubmitting(false);
    }
  }

  if (!user || user.role !== 'teacher') return null;

  return (
    <>
      <div className="mb-6">
        <Link href="/dashboard/teacher/assignments">
          <Button variant="ghost" className="mb-4 gap-2">
            <ChevronLeft className="w-4 h-4" />
            Back to Assignments
          </Button>
        </Link>
        <DashboardHeader
          title="Create New Assignment"
          description="Post a homework assignment to one of your classes"
        />
      </div>

      <div className="max-w-2xl space-y-6">

        {/* Class Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Select Class</CardTitle>
            <CardDescription>Choose which class to post this assignment to</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingClassrooms ? (
              <div className="h-10 bg-muted animate-pulse rounded-md" />
            ) : classrooms.length > 0 && (
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class..." />
                  </SelectTrigger>
                  <SelectContent>
                    {classrooms.map((cls) => (
                      <SelectItem key={cls.classId} value={cls.classId}>
                        {cls.className}
                        <span className="ml-2 text-xs text-muted-foreground font-mono">
                          ({cls.accessCode})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.class && <p className="text-sm text-red-500">{errors.class}</p>}
              </div>
            )}

            {classrooms.length === 0 && !showNewClass && (
              <p className="text-sm text-muted-foreground">
                You have no classes yet. Create one to get started.
              </p>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => { setShowNewClass((v) => !v); setClassError(''); }}
            >
              <Plus className="w-4 h-4" />
              {showNewClass ? 'Cancel' : 'Create New Class'}
            </Button>

            {showNewClass && (
              <form onSubmit={handleCreateClass} className="space-y-3 pt-3 border-t border-border">
                {classError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg p-3 flex gap-2 text-sm text-red-700 dark:text-red-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{classError}</span>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="className">Class Name *</Label>
                    <Input
                      id="className"
                      placeholder="e.g. English 101"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      disabled={creatingClass}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="accessCode">
                      Access Code *
                      <span className="text-xs text-muted-foreground ml-1">(share with students)</span>
                    </Label>
                    <Input
                      id="accessCode"
                      placeholder="e.g. ENG101"
                      value={newAccessCode}
                      onChange={(e) => setNewAccessCode(e.target.value.toUpperCase())}
                      disabled={creatingClass}
                      className="font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="classDesc">Description (optional)</Label>
                  <Input
                    id="classDesc"
                    placeholder="e.g. Introduction to English Literature"
                    value={newClassDesc}
                    onChange={(e) => setNewClassDesc(e.target.value)}
                    disabled={creatingClass}
                  />
                </div>

                <Button type="submit" size="sm" disabled={creatingClass}>
                  {creatingClass ? 'Creating...' : 'Create Class'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Assignment Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assignment Details</CardTitle>
              <CardDescription>Write the title and content for this homework</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g. Essay on Climate Change"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: '' })); }}
                  disabled={submitting}
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  placeholder="Describe the assignment in detail. Include instructions, requirements, and any relevant information for your students..."
                  rows={8}
                  value={content}
                  onChange={(e) => { setContent(e.target.value); setErrors((p) => ({ ...p, content: '' })); }}
                  disabled={submitting}
                />
                {errors.content && <p className="text-sm text-red-500">{errors.content}</p>}
              </div>
            </CardContent>
          </Card>

          {submitError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg p-3 flex gap-2 text-sm text-red-700 dark:text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={submitting || !selectedClassId}>
              {submitting ? 'Posting...' : 'Post Assignment'}
            </Button>
            <Link href="/dashboard/teacher/assignments">
              <Button type="button" variant="outline" disabled={submitting}>
                Cancel
              </Button>
            </Link>
          </div>
        </form>

      </div>
    </>
  );
}