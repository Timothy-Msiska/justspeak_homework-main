'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase'; // ✅ Supabase client
import Link from 'next/link';
import { ChevronLeft, Edit, Trash2 } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  dueDate: string;
  maxScore: number;
  status: string;
  averageScore?: number;
  rubric?: any[];
}

// Props will come from Next.js dynamic route params
export default function AssignmentDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!user || user.role !== 'teacher') {
    return null;
  }

  const [assignment, setAssignment] = useState<Assignment | null>(null);

  // Fetch the assignment from Supabase
  useState(() => {
    async function fetchAssignment() {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) {
        console.error(error);
        setAssignment(null);
      } else {
        setAssignment(data);
      }
    }

    fetchAssignment();
  });

  if (!assignment) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/teacher/assignments">
          <Button variant="ghost" className="gap-2">
            <ChevronLeft className="w-4 h-4" />
            Back to Assignments
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">Assignment not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ Handle Delete
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    setIsDeleting(true);
    const { error } = await supabase.from('assignments').delete().eq('id', assignment.id);

    if (error) {
      console.error(error);
      setIsDeleting(false);
      alert('Failed to delete assignment.');
    } else {
      router.push('/dashboard/teacher/assignments');
    }
  };

  // ✅ Handle Edit
  const handleEdit = () => {
    router.push(`/dashboard/teacher/assignments/edit/${assignment.id}`);
  };

  return (
    <>
      <div className="mb-6">
        <Link href="/dashboard/teacher/assignments">
          <Button variant="ghost" className="gap-2 mb-4">
            <ChevronLeft className="w-4 h-4" />
            Back to Assignments
          </Button>
        </Link>
        <DashboardHeader
          title={assignment.title}
          description="View assignment details and student submissions"
        >
          <Button variant="outline" className="gap-2" onClick={handleEdit}>
            <Edit className="w-4 h-4" />
            Edit
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleDelete} disabled={isDeleting}>
            <Trash2 className="w-4 h-4" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DashboardHeader>
      </div>

      {/* Assignment Info */}
      <Card>
        <CardHeader>
          <CardTitle>Assignment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p><strong>Description:</strong> {assignment.description}</p>
          {assignment.instructions && <p><strong>Instructions:</strong> {assignment.instructions}</p>}
          <p><strong>Due Date:</strong> {new Date(assignment.dueDate).toLocaleString()}</p>
          <p><strong>Max Score:</strong> {assignment.maxScore}</p>
          <Badge className="mt-2">{assignment.status}</Badge>
        </CardContent>
      </Card>
    </>
  );
}