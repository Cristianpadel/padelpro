"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfoCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  actionText?: string;
  onActionClick?: () => void;
  storageKey: string; // Key to remember dismissal
}

export const InfoCard: React.FC<InfoCardProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onActionClick,
  storageKey,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // This effect runs only on the client
    if (typeof window !== 'undefined') {
      const hasBeenDismissed = localStorage.getItem(storageKey);
      if (!hasBeenDismissed) {
        setIsVisible(true);
      }
    }
  }, [storageKey]);

  const handleDismiss = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent triggering onActionClick if nested
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, 'dismissed');
    }
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Card className="bg-primary/5 border-primary/20 shadow-sm relative overflow-hidden">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="flex-shrink-0">
          <div className="bg-primary/10 p-3 rounded-l-full">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
        <div className="flex-grow">
          <h4 className="font-semibold text-foreground">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 self-start">
            {onActionClick && actionText && (
                <Button onClick={onActionClick} size="sm" className="h-8 rounded-l-full">
                    {actionText} <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
            )}
            <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground" onClick={handleDismiss}>
                No
            </Button>
        </div>
      </CardContent>
    </Card>
  );
};
