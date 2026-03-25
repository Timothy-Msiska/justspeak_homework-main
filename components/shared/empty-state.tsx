'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="text-center">
          {icon && <div className="flex justify-center mb-4">{icon}</div>}
          <h3 className="font-semibold mb-2 text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
          {action && (
            <Button
              onClick={action.onClick}
              {...(action.href ? { asChild: true } : {})}
            >
              {action.href ? <a href={action.href}>{action.label}</a> : action.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
