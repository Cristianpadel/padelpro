"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { TimeSlot } from '@/types';
import { getInitials } from '@/lib/utils';

interface ClassEnrolledRowCardProps {
  slot: TimeSlot;
}

const ClassEnrolledRowCard: React.FC<ClassEnrolledRowCardProps> = ({ slot }) => {
  const players = slot.bookedPlayers || [];

  return (
    <Link href={`/clases/${slot.id}`} className="block">
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-2">
            {players.map((p, idx) => (
              <div
                key={`${p.userId}-${idx}`}
                className="relative inline-flex items-center justify-center h-12 w-12 rounded-full border-[3px] z-0 transition-all shadow-inner bg-slate-100 border-slate-300"
              >
                <Avatar className="h-[calc(100%-4px)] w-[calc(100%-4px)]">
                  <AvatarImage src={p.profilePictureUrl} />
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {getInitials(p.name || '')}
                  </AvatarFallback>
                </Avatar>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ClassEnrolledRowCard;
