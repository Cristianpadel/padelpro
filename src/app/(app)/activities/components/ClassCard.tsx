import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Users } from 'lucide-react';

interface ClassCardProps {
  instructor: {
    name: string;
    avatar: string;
  };
  time: string;
  level: number;
  slots: { [key: string]: number };
  availableSlots: number;
}

export function ClassCard({
  instructor,
  time,
  level,
  slots,
  availableSlots,
}: ClassCardProps) {
  return (
    <Card className="flex h-full transform flex-col shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={instructor.avatar} alt={instructor.name} data-ai-hint="instructor avatar" />
            <AvatarFallback>{instructor.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg font-semibold">
              {instructor.name}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{time}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>Level {level.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <h4 className="font-semibold text-sm">Price per person:</h4>
        <div className="space-y-2">
          {Object.entries(slots).map(([numPlayers, price]) => (
            <div
              key={numPlayers}
              className="flex items-center justify-between rounded-md bg-secondary/50 p-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Group of {numPlayers}</span>
              </div>
              <span className="font-bold text-primary">€{price}</span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <Badge variant={availableSlots > 0 ? 'default' : 'destructive'}>
          {availableSlots} slots available
        </Badge>
        <Button disabled={availableSlots === 0}>Pre-book</Button>
      </CardFooter>
    </Card>
  );
}
