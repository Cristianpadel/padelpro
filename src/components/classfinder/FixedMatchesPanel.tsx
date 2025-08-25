"use client";

import React, { useEffect, useMemo, useState } from 'react';
import type { Match, User, Club } from '@/types';
import { fetchMatches as fetchMatchesMock, getMockClubs, getMockCurrentUser } from '@/lib/mockData';
import { USE_DB_FIXED } from '@/lib/config';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import LevelCategorySemicircle from '@/components/common/LevelCategorySemicircle';

interface FixedMatchesPanelProps {
  selectedDate: Date | null;
}

export default function FixedMatchesPanel({ selectedDate }: FixedMatchesPanelProps) {
  const [club, setClub] = useState<Club | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const clubs = await getMockClubs();
        const c = clubs[0];
        setClub(c || null);
        // Best-effort purge of expired provisional holds (server will no-op if none)
        if (USE_DB_FIXED) {
          fetch('/api/fixed-matches/maintenance', { method: 'POST' }).catch(() => {});
        }
        const [ms, u] = await Promise.all([
          USE_DB_FIXED
            ? fetch(`/api/fixed-matches?clubId=${encodeURIComponent(c?.id || '')}`).then(r => r.json()).then(j => j.data as Match[])
            : fetchMatchesMock(c?.id),
          getMockCurrentUser()
        ]);
        setMatches((ms || []).filter(m => m.isFixedMatch));
        setCurrentUser(u);
      } finally {
        setLoading(false);
      }
    };
    load();
    // Refresh on global updates (e.g., after editing level/cat in Mi agenda)
    const handler = () => {
      if (!club) return;
      (async () => {
        try {
          const ms = USE_DB_FIXED
            ? await fetch(`/api/fixed-matches?clubId=${encodeURIComponent(club.id)}`).then(r => r.json()).then(j => j.data as Match[])
            : await fetchMatchesMock(club.id);
          setMatches((ms || []).filter(m => m.isFixedMatch));
        } catch {}
      })();
    };
    if (typeof window !== 'undefined') window.addEventListener('matchesUpdated', handler);
    return () => {
      if (typeof window !== 'undefined') window.removeEventListener('matchesUpdated', handler);
    };
  }, [club]);

  const matchesForDay = useMemo(() => {
    if (!selectedDate) return [];
    return matches.filter(m => isSameDay(new Date(m.startTime), selectedDate));
  }, [matches, selectedDate]);

  const byHour = useMemo(() => {
    const map = new Map<string, Match[]>();
    for (const m of matchesForDay) {
      const key = format(new Date(m.startTime), 'HH:mm');
      const arr = map.get(key) || [];
      arr.push(m);
      map.set(key, arr);
    }
    return Array.from(map.entries()).sort((a,b) => a[0].localeCompare(b[0]));
  }, [matchesForDay]);

  if (loading) return <div className="space-y-2">Cargando partidas fijas…</div>;
  if (!selectedDate) return <div className="text-muted-foreground">Selecciona un día</div>;
  if (byHour.length === 0) return <div className="text-muted-foreground">No hay partidas fijas este día.</div>;

  return (
    <div className="space-y-4">
      {byHour.map(([hour, list]) => (
        <Card key={hour}>
          <CardHeader className="py-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="font-semibold text-lg">{hour}h</span>
              {list[0]?.courtNumber && (
                <Badge variant="secondary">Pista #{list[0].courtNumber}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-3">
            <div className="grid gap-3 md:grid-cols-2">
              {list.map(m => (
                <div key={m.id} className="flex items-center gap-3 border rounded-md p-3">
                  <div className="flex items-center gap-2 min-w-[180px]">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={m.organizerId ? undefined : undefined} alt="Org" />
                      <AvatarFallback>ORG</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{m.organizerId ? 'Organizador' : 'Grupo'}</span>
                      <span className="text-xs text-muted-foreground">{m.fixedSchedule?.hasReservedCourt ? 'Con pista' : 'Sin pista'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Level/Category semicircle indicator */}
                    <LevelCategorySemicircle level={m.level} category={m.category} club={club} size={16} />
                    {(m.bookedPlayers || []).map(p => (
                      <Avatar key={p.userId} className="h-8 w-8 border">
                        <AvatarImage src={p.profilePictureUrl} alt={p.name || p.userId} />
                        <AvatarFallback>{(p.name || 'J').slice(0,2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    ))}
                    {Array.from({ length: Math.max(0, 4 - (m.bookedPlayers || []).length) }).map((_, idx) => (
                      <div key={idx} className="h-8 w-8 rounded-full border border-dashed" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
