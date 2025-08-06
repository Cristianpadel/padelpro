import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, PlusCircle, Share2, Star, User, Users } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { TimeSlot, User as StudentUser } from '@/types';
import BookingSpotDisplay from './BookingSpotDisplay';
import { useState } from 'react';

interface ClassCardProps {
  instructor: {
    name: string;
    avatar: string;
    rating: number;
  };
  classInfo: TimeSlot;
  availableCourts: number;
}

const bookingOptions: (1 | 2 | 3 | 4)[] = [1, 2, 3, 4];

export function ClassCard({
  instructor,
  classInfo,
  availableCourts,
}: ClassCardProps) {

  // MOCK DATA FOR DEMO - In a real app this would come from state management/API
  const [currentUser] = useState<StudentUser>({ id: 'user-1', name: 'Alex García', credit: 100, loyaltyPoints: 1250, level: '3.5' });
  const [isPendingMap, setIsPendingMap] = useState<Record<string, boolean>>({});
  const bookingsByGroupSize = classInfo.bookedPlayers.reduce((acc, player) => {
    // This is a simplification. A real implementation needs to know which option the player booked.
    // For now, we'll just assume they booked the smallest possible group size.
    // This logic needs to be revisited when booking is implemented.
    const groupSize = 4; // Placeholder
    if (!acc[groupSize]) acc[groupSize] = [];
    acc[groupSize].push({ userId: player.userId, groupSize: 4});
    return acc;
  }, {} as Record<number, { userId: string, groupSize: 1|2|3|4 }[]>);
  // END MOCK DATA


  const handleOpenConfirmationDialog = (optionSize: 1 | 2 | 3 | 4, spotIdx: number) => {
    // This would open a confirmation dialog in a real app
    console.log(`Open confirmation for option ${optionSize}, spot ${spotIdx}`);
  };


  return (
    <Card className="flex h-full transform flex-col shadow-lg transition-transform duration-300">
      <CardHeader className="p-4">
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
                <AvatarImage src={instructor.avatar} alt={instructor.name} data-ai-hint="instructor avatar" />
                <AvatarFallback>{instructor.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <h3 className="text-lg font-semibold">
                {classInfo.instructorName}
                </h3>
                <div className="flex items-center gap-1 text-sm text-amber-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span>({instructor.rating})</span>
                </div>
            </div>
            </div>
          <Button size="sm" className="bg-primary/10 text-primary hover:bg-primary/20">
            <PlusCircle className="mr-2 h-4 w-4" />
            Reservar Privada
          </Button>
        </div>
        <Separator className="my-2" />
        <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-bold text-xl text-foreground">{format(classInfo.startTime, 'HH:mm').split(":")[0]}</span>
                <span className="text-xs uppercase">{format(classInfo.startTime, 'EEE')}<br/>{format(classInfo.startTime, 'MMM')}</span>
                <Separator orientation="vertical" className="h-8 mx-2" />
                 <div>
                    <p className="font-semibold text-foreground">{format(classInfo.startTime, 'HH:mm')} - {format(classInfo.endTime, 'HH:mm')}</p>
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{classInfo.durationMinutes} min</span>
                    </div>
                 </div>
            </div>
            <Button variant="ghost" size="icon">
                <Share2 className="h-5 w-5" />
            </Button>
        </div>
         <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary" className="font-normal">{classInfo.category}</Badge>
             <Badge variant="secondary" className="font-normal">Pista {classInfo.courtNumber}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 p-4 pt-0">
        {bookingOptions.map((optionSize) => (
            <div key={optionSize} className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                    {[...Array(optionSize)].map((_, i) => (
                        <BookingSpotDisplay
                            key={i}
                            optionSize={optionSize as (1|2|3|4)}
                            spotIndex={i}
                            bookingsByGroupSize={bookingsByGroupSize}
                            currentUser={currentUser}
                            currentSlot={classInfo}
                            isPendingMap={isPendingMap}
                            totalPrice={28} // MOCK PRICE
                            pointsCostForGratisSpot={10} // MOCK
                            isSlotOverallConfirmed={false} // MOCK
                            confirmedGroupSize={null} // MOCK
                            userHasConfirmedActivityToday={false} // MOCK
                            isUserBookedInThisOption={false} // MOCK
                            onOpenConfirmationDialog={handleOpenConfirmationDialog}
                            showPointsBonus={true}
                        />
                    ))}
                </div>
                 <span className="font-semibold text-foreground text-sm">
                    {(28 / optionSize).toFixed(2)} € p.p.
                 </span>
            </div>
        ))}
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2 rounded-b-lg bg-secondary/50 p-4">
        <p className="text-sm font-semibold">Pistas disponibles</p>
        <div className="flex items-center gap-2">
            <Badge>{availableCourts}</Badge>
            <div className="flex gap-1">
                {[...Array(availableCourts)].map((_, i) => (
                    <div key={i} className="h-5 w-5 rounded-sm bg-green-400 border border-green-600" />
                ))}
                 {[...Array(8-availableCourts)].map((_, i) => (
                    <div key={i} className="h-5 w-5 rounded-sm bg-muted border" />
                ))}
            </div>
        </div>
      </CardFooter>
    </Card>
  );
}