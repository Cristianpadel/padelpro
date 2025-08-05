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
import { Clock, Users } from 'lucide-react';

interface MatchCardProps {
  level: string;
  time: string;
  players: { name: string; avatar: string }[];
}

const TOTAL_SLOTS = 4;

export function MatchCard({ level, time, players }: MatchCardProps) {
  const openSlots = TOTAL_SLOTS - players.length;

  return (
    <Card className="flex h-full transform flex-col shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Friendly Match</CardTitle>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>Level {level}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{time}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <h4 className="font-semibold text-sm">Players ({players.length}/{TOTAL_SLOTS})</h4>
        <div className="grid grid-cols-2 gap-3">
          {[...Array(TOTAL_SLOTS)].map((_, i) =>
            players[i] ? (
              <div key={i} className="flex items-center gap-2 rounded-md border p-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={players[i].avatar} alt={players[i].name} data-ai-hint="player avatar" />
                  <AvatarFallback>{players[i].name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{players[i].name}</span>
              </div>
            ) : (
              <div key={i} className="flex items-center gap-2 rounded-md border border-dashed p-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">Open Slot</span>
              </div>
            )
          )}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <Badge variant={openSlots > 0 ? 'default' : 'destructive'}>
          {openSlots} slots open
        </Badge>
        <Button disabled={openSlots === 0}>Join Match</Button>
      </CardFooter>
    </Card>
  );
}
