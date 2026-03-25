'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  getClassroomsByTeacher,
  getHomeworkByClass,
  getAllSubmissionsForClass,
  getStudentsByClass,
  getFeedbackForHomework,
  getFeedbackByTeacher,
  type DBClassroom,
  type DBHomework,
  type DBFeedback,
} from '@/lib/db';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

interface AssignmentStat {
  name: string;
  submissions: number;
  graded: number;
}

interface StudentStat {
  name: string;
  average: number;
}

export default function AnalyticsPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [totalAssignments, setTotalAssignments] = useState(0);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [gradedCount, setGradedCount] = useState(0);
  const [gradeDistribution, setGradeDistribution] = useState<{ name: string; value: number }[]>([]);
  const [assignmentStats, setAssignmentStats] = useState<AssignmentStat[]>([]);
  const [studentStats, setStudentStats] = useState<StudentStat[]>([]);

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  async function load() {
    if (!user) return;
    try {
      const classrooms = await getClassroomsByTeacher(user.id);

      let hwTotal = 0;
      let subTotal = 0;
      let studentTotal = 0;
      const hwStats: AssignmentStat[] = [];
      const allFeedback: DBFeedback[] = [];
      const studentGradeMap = new Map<string, number[]>(); // email → numeric grades

      await Promise.all(
        classrooms.map(async (cls: DBClassroom) => {
          const [hw, subs, students] = await Promise.all([
            getHomeworkByClass(cls.accessCode),
            getAllSubmissionsForClass(cls.accessCode),
            getStudentsByClass(cls.classId),
          ]);

          hwTotal += hw.length;
          subTotal += subs.length;
          studentTotal += students.length;

          // Per-assignment stats
          await Promise.all(
            hw.map(async (h: DBHomework) => {
              const matchingSubs = subs.filter((s) => s.homeworkTitle === h.homeworkTitle);
              let gradedForHw = 0;
              await Promise.all(
                matchingSubs.map(async (sub) => {
                  const fb = await getFeedbackForHomework(sub.homeworkId);
                  if (fb) {
                    gradedForHw++;
                    allFeedback.push(fb);
                    // track per-student
                    if (sub.email) {
                      const n = parseFloat(fb.grade ?? '');
                      if (!isNaN(n)) {
                        const arr = studentGradeMap.get(sub.email) ?? [];
                        arr.push(n);
                        studentGradeMap.set(sub.email, arr);
                      }
                    }
                  }
                })
              );
              hwStats.push({
                name: h.homeworkTitle.length > 16 ? h.homeworkTitle.substring(0, 16) + '…' : h.homeworkTitle,
                submissions: matchingSubs.length,
                graded: gradedForHw,
              });
            })
          );

          // Student names map for display
          students.forEach((s) => {
            if (!studentGradeMap.has(s.email)) {
              studentGradeMap.set(s.email, []);
            }
          });
        })
      );

      setTotalAssignments(hwTotal);
      setTotalSubmissions(subTotal);
      setTotalStudents(studentTotal);
      setGradedCount(allFeedback.length);
      setAssignmentStats(hwStats);

      // Grade distribution — only numeric grades
      const numericGrades = allFeedback
        .map((f) => parseFloat(f.grade ?? ''))
        .filter((n) => !isNaN(n));

      setGradeDistribution([
        { name: 'A (90–100)', value: numericGrades.filter((g) => g >= 90).length },
        { name: 'B (80–89)', value: numericGrades.filter((g) => g >= 80 && g < 90).length },
        { name: 'C (70–79)', value: numericGrades.filter((g) => g >= 70 && g < 80).length },
        { name: 'D (60–69)', value: numericGrades.filter((g) => g >= 60 && g < 70).length },
        { name: 'F (0–59)', value: numericGrades.filter((g) => g < 60).length },
      ]);

      // Student performance — only students with at least one numeric grade
      const stuStats: StudentStat[] = [];
      // Need names — fetch all students again
      const allStudentRows = await Promise.all(
        classrooms.map((cls: DBClassroom) => getStudentsByClass(cls.classId))
      );
      const allStudents = allStudentRows.flat();

      studentGradeMap.forEach((grades, email) => {
        if (grades.length === 0) return;
        const student = allStudents.find((s) => s.email === email);
        const avg = grades.reduce((a, b) => a + b, 0) / grades.length;
        stuStats.push({
          name: student ? student.name.split(' ')[0] : email,
          average: parseFloat(avg.toFixed(1)),
        });
      });

      setStudentStats(stuStats.sort((a, b) => b.average - a.average));
    } finally {
      setLoading(false);
    }
  }

  if (!user || user.role !== 'teacher') return null;

  const hasGradeData = gradeDistribution.some((d) => d.value > 0);

  return (
    <>
      <DashboardHeader
        title="Analytics & Reports"
        description="View classroom performance and student progress"
      />

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : totalAssignments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : totalSubmissions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Graded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : gradedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : totalStudents}</div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Grade Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
                <CardDescription>
                  {hasGradeData
                    ? 'Distribution of numeric grades across all submissions'
                    : 'No numeric grades yet — grades like A, B, C are not shown here'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasGradeData ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={gradeDistribution.filter((d) => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={false}
                      >
                        {gradeDistribution.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                    No numeric grade data yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Student Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Student Performance</CardTitle>
                <CardDescription>Average numeric grade per student</CardDescription>
              </CardHeader>
              <CardContent>
                {studentStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={studentStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(v) => [`${v}%`, 'Average']} />
                      <Bar dataKey="average" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                    No graded submissions yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Assignment Completion */}
          {assignmentStats.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Assignment Completion</CardTitle>
                <CardDescription>Submissions received vs graded per assignment</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={assignmentStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="submissions" name="Submitted" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="graded" name="Graded" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </>
  );
}