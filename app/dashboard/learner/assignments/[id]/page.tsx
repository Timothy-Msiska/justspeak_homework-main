'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Submission is now handled via the dialog on the main assignments page.
// This page redirects there to avoid duplicate logic.
export default function AssignmentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/dashboard/learner/assignments?submit=${params.id}`);
  }, [params.id, router]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}