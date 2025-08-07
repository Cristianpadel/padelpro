// src/components/match-day/PersonalMatchDay.tsx
"use client";

import React from 'react';
import type { MatchBooking, User, MatchDayEvent, MatchDayInscription } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { List } from 'lucide-react';

interface PersonalMatchDayProps {
  currentUser: User;
  upcomingEvents: { event: MatchDayEvent, userInscription?: MatchDayInscription }[];
}

const PersonalMatchDay: React.FC<PersonalMatchDayProps> = ({ currentUser, upcomingEvents }) => {

  if (upcomingEvents.length === 0) {
    return null; // Don't render if no events
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-xl"><List className="mr-2 h-5 w-5" /> Eventos Match-Day</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcomingEvents.map(({ event, userInscription }) => (
          <div key={event.id} className="p-3 border rounded-lg">
            <p className="font-semibold">{event.name}</p>
            {userInscription ? (
              <p className="text-sm text-green-600">Estás en la lista {userInscription.status === 'main' ? 'principal' : 'de reserva'}.</p>
            ) : (
              <p className="text-sm text-muted-foreground">No estás inscrito en este evento.</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default PersonalMatchDay;
