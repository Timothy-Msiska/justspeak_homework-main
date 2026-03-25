'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  getClassroomsByTeacher,
  getHomeworkByClass,
  getSubmissionsForHomework,
  type DBClassroom,
  type DBHomework,
} from '@/lib/db';
import Link from 'next/link';
import { Plus, Eye } from 'lucide-react';

interface HomeworkWithStats extends DBHomework {
  submissionCount: number;
  className: string;
}

export default function TeacherAssignmentsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<HomeworkWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  async function load() {
    if (!user) return;
    try {
      const classrooms = await getClassroomsByTeacher(user.id);
      const all: HomeworkWithStats[] = [];

      await Promise.all(
        classrooms.map(async (cls: DBClassroom) => {
          const hw = await getHomeworkByClass(cls.accessCode);
          await Promise.all(
            hw.map(async (h: DBHomework) => {
              const subs = await getSubmissionsForHomework(cls.accessCode, h.homeworkTitle);
              all.push({ ...h, submissionCount: subs.length, className: cls.className });
            })
          );
        })
      );

      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setItems(all);
    } finally {
      setLoading(false);
    }
  }

  if (!user || user.role !== 'teacher') return null;

  return (
    <>
      <DashboardHeader
        title="Assignments"
        description="Create and manage homework assignments"
      >
        <Link href="/dashboard/teacher/assignments/create">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Assignment
          </Button>
        </Link>
      </DashboardHeader>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="font-semibold mb-2">No assignments yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first assignment to get started.
            </p>
            <Link href="/dashboard/teacher/assignments/create">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Assignment
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((hw) => (
            <Card key={hw.homeworkId} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg truncate">{hw.homeworkTitle}</h3>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Published
                      </Badge>
                      <Badge variant="outline">{hw.className}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {hw.homeworkContent}
                    </p>
                    <div className="flex gap-6 text-sm">
                      <div>
                        <span className="text-muted-foreground">Posted</span>
                        <p className="font-medium">{new Date(hw.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Submissions</span>
                        <p className="font-medium">{hw.submissionCount}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <Link
                      href={`/dashboard/teacher/submissions?homework=${encodeURIComponent(hw.homeworkTitle)}&class=${encodeURIComponent(hw.accessCode)}`}
                    >
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                        View Submissions
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