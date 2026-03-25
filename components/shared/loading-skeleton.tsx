'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="h-3 bg-muted rounded w-full animate-pulse"></div>
            <div className="h-3 bg-muted rounded w-5/6 animate-pulse"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <Card>
      <CardContent className="py-8">
        <div className="space-y-3">
          <div className="h-6 bg-muted rounded w-1/3 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-2/3 animate-pulse"></div>
        </div>
      </CardContent>
    </Card>
  );
}
