"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { TimeSlot, Club, Instructor, PadelCourt } from '@/types';
import { displayClassLevel, displayClassCategory } from '@/types';
import { getMockClubs, getMockInstructors, getCourtAvailabilityForInterval } from '@/lib/mockData';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getInitials } from '@/lib/utils';
import { ClassCardFooter } from '@/components/class/ClassCard/ClassCardFooter';
import { Plus } from 'lucide-react';

interface Props {
  slot: TimeSlot;
}

const ClassEnrolledHeaderRowCard: React.FC<Props> = ({ slot }) => {
  const [clubInfo, setClubInfo] = useState<Club | null>(null);
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [courtAvailability, setCourtAvailability] = useState<{ available: PadelCourt[]; occupied: PadelCourt[]; total: number }>({ available: [], occupied: [], total: 0 });

  useEffect(() => {
    const club = getMockClubs().find(c => c.id === slot.clubId) || null;
    setClubInfo(club);
    const inst = getMockInstructors().find(i => i.id === slot.instructorId) || null;
    setInstructor(inst);
  }, [slot.clubId, slot.instructorId]);

  useEffect(() => {
    const loadAvailability = async () => {
      const availability = await getCourtAvailabilityForInterval(slot.clubId, new Date(slot.startTime), new Date(slot.endTime));
      setCourtAvailability(availability);
    };
    loadAvailability();
  }, [slot.clubId, slot.startTime, slot.endTime]);

  // Flatten booked seats by expanding each booking according to its groupSize, to show a single occupancy row
  const filledSeats = useMemo(() => {
    const seats: { userId: string; name?: string; profilePictureUrl?: string }[] = [];
    (slot.bookedPlayers || []).forEach(p => {
      const count = Math.max(1, Math.min(4, p.groupSize || 1));
      for (let i = 0; i < count; i++) {
        seats.push({ userId: p.userId, name: (p as any).name, profilePictureUrl: (p as any).profilePictureUrl });
      }
    });
    return seats.slice(0, slot.maxPlayers);
  }, [slot.bookedPlayers, slot.maxPlayers]);

  const headerTime = useMemo(() => format(new Date(slot.startTime), "EEE d MMM · HH:mm'h'", { locale: es }), [slot.startTime]);
  const perSeatPrice = useMemo(() => {
    const total = slot.totalPrice ?? 0;
    if (!total || !slot.maxPlayers) return null;
    const each = total / slot.maxPlayers;
    return isFinite(each) && each > 0 ? each : null;
  }, [slot.totalPrice, slot.maxPlayers]);

  return (
    <Link href={`/clases/${slot.id}`} className="block">
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-9 w-9">
                <AvatarImage src={instructor?.profilePictureUrl} />
                <AvatarFallback>{getInitials(instructor?.name || 'I')}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{instructor?.name || 'Instructor'}</div>
                <div className="text-xs text-muted-foreground truncate">{headerTime}</div>
              </div>
            </div>
            {clubInfo && (
              <div className="text-xs text-muted-foreground hidden sm:block truncate max-w-[40%] text-right">{clubInfo.name}</div>
            )}
          </div>
          {/* Chips row: level, category, pista */}
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="text-[11px] leading-none rounded-md bg-slate-100 text-slate-700 px-2 py-1 font-medium">
              {displayClassLevel(slot.level, true)}
            </span>
            <span className="text-[11px] leading-none rounded-md bg-slate-100 text-slate-700 px-2 py-1 font-medium">
              {displayClassCategory(slot.category, true)}
            </span>
            <span className="text-[11px] leading-none rounded-md bg-slate-100 text-slate-700 px-2 py-1 font-medium">
              Pista
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex items-center gap-3 flex-wrap">
            {Array.from({ length: slot.maxPlayers }).map((_, idx) => {
              const seat = filledSeats[idx];
              if (seat) {
                return (
                  <div key={`seat-${idx}-${seat.userId}`} className="flex flex-col items-center">
                    <div className="relative inline-flex items-center justify-center h-12 w-12 rounded-full border-[3px] z-0 transition-all shadow-inner bg-slate-100 border-slate-300">
                      <Avatar className="h-[calc(100%-4px)] w-[calc(100%-4px)]">
                        <AvatarImage src={seat.profilePictureUrl} />
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                          {getInitials(seat.name || '')}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    {perSeatPrice !== null && (
                      <span className="mt-1 text-[11px] text-muted-foreground font-medium">{perSeatPrice.toFixed(2)}€</span>
                    )}
                  </div>
                );
              }
              return (
                <div key={`empty-${idx}`} className="flex flex-col items-center">
                  <div
                    className="relative inline-flex items-center justify-center h-12 w-12 rounded-full border-[3px] z-0 transition-all shadow-inner bg-slate-100 border-slate-300 border-dashed"
                    title="Apúntate para completar esta clase"
                  >
                    <Plus className="h-5 w-5 text-muted-foreground" />
                  </div>
                  {perSeatPrice !== null && (
                    <span className="mt-1 text-[11px] text-muted-foreground font-medium">{perSeatPrice.toFixed(2)}€</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Info banner like the example */}
          <div className="mt-3">
            <div className="w-full rounded-xl bg-blue-50 text-blue-900 px-3 py-2 text-sm font-medium shadow-sm border border-blue-100">
              {filledSeats.length > 0
                ? (
                    <span>
                      Hay {filledSeats.length} jugador{filledSeats.length === 1 ? '' : 'es'} apuntado{filledSeats.length === 1 ? '' : 's'}, ¡faltan {Math.max(0, slot.maxPlayers - filledSeats.length)} más para confirmar la clase!
                    </span>
                  )
                : (
                    <span>¡Sé el primero en apuntarte a esta clase!</span>
                  )}
            </div>
          </div>
          <div className="mt-3">
            <ClassCardFooter courtAvailability={courtAvailability} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ClassEnrolledHeaderRowCard;
