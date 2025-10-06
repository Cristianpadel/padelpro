// src/components/class/OpenGroupClasses.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, Users, MapPin, Euro, UserPlus, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Player {
  id: string;
  name: string;
  profilePicture?: string;
}

interface OpenClass {
  id: string;
  instructor: {
    name: string;
    profilePicture?: string;
  };
  startTime: string;
  endTime: string;
  date: string;
  level: string;
  category: string;
  maxPlayers: number;
  currentPlayers: number;
  availableSpots: number;
  pricePerPlayer: number;
  isAvailable: boolean;
  players: Player[];
}

interface OpenGroupClassesProps {
  clubId: string;
  selectedDate: Date;
  currentUserId: string;
}

export default function OpenGroupClasses({ clubId, selectedDate, currentUserId }: OpenGroupClassesProps) {
  const [openClasses, setOpenClasses] = useState<OpenClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningClass, setJoiningClass] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOpenClasses = async () => {
    try {
      setLoading(true);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetch(`/api/classes/open-group-classes?clubId=${clubId}&date=${dateStr}`);
      
      if (response.ok) {
        const data = await response.json();
        setOpenClasses(data.classes);
      } else {
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las clases abiertas',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching open classes:', error);
      toast({
        title: 'Error',
        description: 'Error de conexión al cargar las clases',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const joinClass = async (timeSlotId: string) => {
    try {
      setJoiningClass(timeSlotId);
      
      const response = await fetch('/api/classes/join-group-class', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeSlotId,
          userId: currentUserId
        })
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: '¡Te has unido a la clase!',
          description: result.classInfo.isComplete 
            ? `Clase completa. Cancha ${result.classInfo.courtAssigned?.number || 'asignada'}` 
            : `Quedan ${result.classInfo.maxPlayers - result.classInfo.currentPlayers} plazas`,
          className: 'bg-green-500 text-white'
        });
        
        // Refrescar la lista de clases
        fetchOpenClasses();
      } else {
        toast({
          title: 'Error al unirse',
          description: result.error || 'No se pudo unir a la clase',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error joining class:', error);
      toast({
        title: 'Error',
        description: 'Error de conexión al unirse a la clase',
        variant: 'destructive'
      });
    } finally {
      setJoiningClass(null);
    }
  };

  useEffect(() => {
    fetchOpenClasses();
  }, [clubId, selectedDate]);

  const isUserInClass = (players: Player[]) => {
    return players.some(player => player.id === currentUserId);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (openClasses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Users className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay clases abiertas</h3>
          <p className="text-gray-500 text-center">
            No hay clases grupales disponibles para esta fecha.
            <br />
            Las clases aparecerán aquí cuando los instructores las publiquen.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Clases Grupales Abiertas</h2>
        <Badge variant="outline">
          {openClasses.length} clase{openClasses.length !== 1 ? 's' : ''} disponible{openClasses.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {openClasses.map((classItem) => {
        const userInClass = isUserInClass(classItem.players);
        const isClassFull = classItem.currentPlayers >= classItem.maxPlayers;
        
        return (
          <Card key={classItem.id} className={`transition-all duration-200 ${userInClass ? 'ring-2 ring-green-500' : ''}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={classItem.instructor.profilePicture} />
                      <AvatarFallback>
                        {classItem.instructor.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {classItem.instructor.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {classItem.startTime} - {classItem.endTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <Euro className="h-4 w-4" />
                      {classItem.pricePerPlayer}€/jugador
                    </span>
                  </CardDescription>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={isClassFull ? "destructive" : "default"}>
                    <Users className="h-3 w-3 mr-1" />
                    {classItem.currentPlayers}/{classItem.maxPlayers}
                  </Badge>
                  {userInClass && (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Inscrito
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Información de la clase */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Nivel: {classItem.level}</span>
                <span>Categoría: {classItem.category}</span>
                <span>{classItem.availableSpots} plaza{classItem.availableSpots !== 1 ? 's' : ''} disponible{classItem.availableSpots !== 1 ? 's' : ''}</span>
              </div>

              {/* Jugadores inscritos */}
              {classItem.players.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Jugadores inscritos:</h4>
                  <div className="flex flex-wrap gap-2">
                    {classItem.players.map((player) => (
                      <div key={player.id} className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={player.profilePicture} />
                          <AvatarFallback className="text-xs">
                            {player.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{player.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botón para unirse */}
              <div className="pt-2">
                {userInClass ? (
                  <Button disabled className="w-full">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Ya estás inscrito
                  </Button>
                ) : isClassFull ? (
                  <Button disabled variant="secondary" className="w-full">
                    Clase completa
                  </Button>
                ) : (
                  <Button 
                    onClick={() => joinClass(classItem.id)}
                    disabled={joiningClass === classItem.id}
                    className="w-full"
                  >
                    {joiningClass === classItem.id ? (
                      <>Uniéndose...</>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Unirse a la clase ({classItem.pricePerPlayer}€)
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}