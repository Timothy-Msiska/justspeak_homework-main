'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  getClassroomsByTeacher,
  getHomeworkByClass,
  getAllSubmissionsForClass,
  getFeedbackByTeacher,
  type DBClassroom,
  type DBHomework,
} from '@/lib/db';
import Link from 'next/link';
import { FileText, Users, CheckCircle, BarChart3, Plus } from 'lucide-react';

interface HomeworkWithStats extends DBHomework {
  submissionCount: number;
  className: string;
}

export default function TeacherDashboard() {
  const { user } = useAuth();

  const [classrooms, setClassrooms] = useState<DBClassroom[]>([]);
  const [homework, setHomework] = useState<HomeworkWithStats[]>([]);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [gradedCount, setGradedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  async function load() {
    if (!user) return;
    try {
      const cls = await getClassroomsByTeacher(user.id);
      setClassrooms(cls);

      const allHomework: HomeworkWithStats[] = [];
      let subTotal = 0;

      await Promise.all(
        cls.map(async (c: DBClassroom) => {
          const [hw, subs] = await Promise.all([
            getHomeworkByClass(c.accessCode),
            getAllSubmissionsForClass(c.accessCode),
          ]);
          subTotal += subs.length;
          hw.forEach((h: DBHomework) => {
            const count = subs.filter((s) => s.homeworkTitle === h.homeworkTitle).length;
            allHomework.push({ ...h, submissionCount: count, className: c.className });
          });
        })
      );

      allHomework.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setHomework(allHomework);
      setTotalSubmissions(subTotal);

      // Graded = submissions that have feedback
      const feedback = await getFeedbackByTeacher(user.name);
      setGradedCount(feedback.length);
      setPendingCount(subTotal - feedback.length);
    } finally {
      setLoading(false);
    }
  }

  if (!user || user.role !== 'teacher') return null;

  return (
    <>
      <DashboardHeader
        title="Teacher Dashboard"
        description="Manage assignments, review submissions, and track student progress"
      >
        <Link href="/dashboard/teacher/assignments/create">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Assignment
          </Button>
        </Link>
      </DashboardHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : homework.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Published</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : Math.max(0, pendingCount)}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting grading</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Graded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : gradedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Submissions graded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : totalSubmissions}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all classes</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Assignments + Pending Submissions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Recent Assignments
            </CardTitle>
            <CardDescription>Your latest posted assignments</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}
              </div>
            ) : homework.length === 0 ? (
              <p className="text-sm text-muted-foreground">No assignments yet. Create one to get started.</p>
            ) : (
              <div className="space-y-3">
                {homework.slice(0, 4).map((hw) => (
                  <div key={hw.homeworkId} className="flex items-start justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate text-sm">{hw.homeworkTitle}</h4>
                      <p className="text-xs text-muted-foreground">
                        {hw.className} · {hw.submissionCount} submission{hw.submissionCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Link href={`/dashboard/teacher/submissions?homework=${encodeURIComponent(hw.homeworkTitle)}&class=${encodeURIComponent(hw.accessCode)}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Pending Review
            </CardTitle>
            <CardDescription>Submissions awaiting your feedback</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}
              </div>
            ) : Math.max(0, pendingCount) === 0 ? (
              <p className="text-sm text-muted-foreground">No pending submissions. Great job!</p>
            ) : (
              <div className="pt-2">
                <p className="text-3xl font-bold">{Math.max(0, pendingCount)}</p>
                <p className="text-sm text-muted-foreground mt-1">submissions need grading</p>
                <Link href="/dashboard/teacher/submissions?filter=pending" className="mt-4 block">
                  <Button size="sm" className="mt-3">Review Submissions</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <Link href="/dashboard/teacher/assignments">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="w-4 h-4" />
                All Assignments
              </CardTitle>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/teacher/students">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="w-4 h-4" />
                Manage Students
              </CardTitle>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/teacher/analytics">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="w-4 h-4" />
                View Analytics
              </CardTitle>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </>
  );
}