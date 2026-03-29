'use client';

import React from 'react';

interface DashboardHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function DashboardHeader({ title, description, children }: DashboardHeaderProps) {
  return (
    <div className="border-b border-border mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 truncate">{title}</h1>
          {description && <p className="text-muted-foreground text-sm sm:text-base">{description}</p>}
        </div>
        {children && <div className="flex gap-2 flex-shrink-0">{children}</div>}
      </div>
    </div>
  );
}
