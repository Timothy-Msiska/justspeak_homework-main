'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getClassroomsByTeacher,
  getStudentsByClass,
  getAllSubmissionsForClass,
  getFeedbackByTeacher,
  type DBUser,
  type DBClassroom,
  type DBHomework,
  type DBFeedback,
} from '@/lib/db';
import { Mail, Users, FileText, BarChart3 } from 'lucide-react';
import Link from 'next/link';

interface StudentRow extends DBUser {
  submissionCount: number;
  gradedCount: number;
  averageGrade: string;
}

export default function StudentsPage() {
  const { user } = useAuth();

  const [classrooms, setClassrooms] = useState<DBClassroom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadClassrooms();
  }, [user]);

  useEffect(() => {
    if (!user || classrooms.length === 0) return;
    loadStudents();
  }, [selectedClassId, classrooms]);

  async function loadClassrooms() {
    if (!user) return;
    try {
      const cls = await getClassroomsByTeacher(user.id);
      setClassrooms(cls);
      if (cls.length > 0) setSelectedClassId(cls[0].classId);
    } catch {
      setLoading(false);
    }
  }

  async function loadStudents() {
    if (!user) return;
    setLoading(true);
    try {
      // Determine which classes to load
      const targetClasses = selectedClassId === 'all'
        ? classrooms
        : classrooms.filter((c) => c.classId === selectedClassId);

      // Fetch students and submissions for each class
      const studentMap = new Map<string, StudentRow>();

      await Promise.all(
        targetClasses.map(async (cls) => {
          const [classStudents, submissions] = await Promise.all([
            getStudentsByClass(cls.classId),
            getAllSubmissionsForClass(cls.accessCode),
          ]);

          classStudents.forEach((s) => {
            const studentSubs = submissions.filter((sub) => sub.email === s.email);
            studentMap.set(s.id, {
              ...s,
              submissionCount: studentSubs.length,
              gradedCount: 0,   // updated below
              averageGrade: '—',
            });
          });
        })
      );

      // Fetch all feedback by this teacher to compute grades per student
      const allFeedback = await getFeedbackByTeacher(user.name);

      // For each student compute graded count and average
      for (const [studentId, studentRow] of studentMap.entries()) {
        // Get all submission homeworkIds for this student across all classes
        const allSubs: DBHomework[] = [];
        await Promise.all(
          targetClasses.map(async (cls) => {
            const subs = await getAllSubmissionsForClass(cls.accessCode);
            subs.filter((s) => s.email === studentRow.email).forEach((s) => allSubs.push(s));
          })
        );

        const subIds = new Set(allSubs.map((s) => s.homeworkId));
        const studentFeedback = allFeedback.filter((f) => subIds.has(f.homeworkId));

        const numericGrades = studentFeedback
          .map((f) => parseFloat(f.grade ?? ''))
          .filter((n) => !isNaN(n));

        studentMap.set(studentId, {
          ...studentRow,
          gradedCount: studentFeedback.length,
          averageGrade: numericGrades.length > 0
            ? (numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length).toFixed(1)
            : '—',
        });
      }

      setStudents(Array.from(studentMap.values()));
    } finally {
      setLoading(false);
    }
  }

  if (!user || user.role !== 'teacher') return null;

  const selectedClassroom = classrooms.find((c) => c.classId === selectedClassId);

  return (
    <>
      <DashboardHeader
        title="Students"
        description="View and manage students across your classes"
      />

      {/* Class selector */}
      {classrooms.length > 1 && (
        <div className="mb-6 max-w-xs">
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger>
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classrooms.map((cls) => (
                <SelectItem key={cls.classId} value={cls.classId}>
                  {cls.className}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Class info card */}
      {selectedClassroom && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {selectedClassroom.className}
            </CardTitle>
            {selectedClassroom.description && (
              <CardDescription>{selectedClassroom.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="flex flex-wrap gap-8">
            <div>
              <p className="text-xs text-muted-foreground">Access Code</p>
              <p className="font-mono text-lg font-bold tracking-widest mt-1">
                {selectedClassroom.accessCode}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Share with students to join</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Students</p>
              <p className="text-2xl font-bold mt-1">{loading ? '—' : students.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Submissions</p>
              <p className="text-2xl font-bold mt-1">
                {loading ? '—' : students.reduce((sum, s) => sum + s.submissionCount, 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No classes */}
      {classrooms.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="font-semibold mb-2">No classes yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a class from the assignments page to get started.
            </p>
            <Link href="/dashboard/teacher/assignments/create">
              <Button>Create a Class</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      )}

      {/* No students */}
      {!loading && classrooms.length > 0 && students.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-2">No students yet</h3>
            <p className="text-sm text-muted-foreground">
              Share the access code{' '}
              <span className="font-mono font-bold">
                {selectedClassroom?.accessCode}
              </span>{' '}
              with your students so they can join.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Students list */}
      {!loading && students.length > 0 && (
        <div className="space-y-3">
          {students.map((student) => (
            <Card key={student.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                  {/* Avatar + name */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary font-bold text-sm">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{student.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Submissions</p>
                      <p className="text-lg font-bold">{student.submissionCount}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Graded</p>
                      <p className="text-lg font-bold">{student.gradedCount}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Avg Grade</p>
                      <p className="text-lg font-bold">{student.averageGrade}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <a href={`mailto:${student.email}`}>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Mail className="w-4 h-4" />
                          Email
                        </Button>
                      </a>
                      <Link href={`/dashboard/teacher/submissions?student=${encodeURIComponent(student.email)}`}>
                        <Button variant="outline" size="sm" className="gap-2">
                          <FileText className="w-4 h-4" />
                          Submissions
                        </Button>
                      </Link>
                    </div>
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