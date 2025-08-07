"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { List } from 'lucide-react';
import PersonalClasses from './PersonalClasses';
import PersonalMatches from './PersonalMatches';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Calendar, Users } from 'lucide-react';
import type { User } from '@/types';

interface PersonalScheduleProps {
  currentUser: User;
  onBookingActionSuccess: () => void;
  refreshKey: number;
}

const PersonalSchedule: React.FC<PersonalScheduleProps> = ({ currentUser, onBookingActionSuccess, refreshKey }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-xl"><List className="mr-2 h-5 w-5" /> Tu Agenda</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="classes" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="classes"><Calendar className="mr-2 h-4 w-4" /> Clases</TabsTrigger>
            <TabsTrigger value="partidas"><Users className="mr-2 h-4 w-4" /> Partidas</TabsTrigger>
          </TabsList>
          <TabsContent value="classes" className="mt-4">
            <PersonalClasses currentUser={currentUser} onBookingActionSuccess={onBookingActionSuccess} />
          </TabsContent>
          <TabsContent value="partidas" className="mt-4">
            <PersonalMatches currentUser={currentUser} onBookingActionSuccess={onBookingActionSuccess} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PersonalSchedule;
