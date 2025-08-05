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

interface Slot {
    type: 'user' | 'instructor';
    price: number;
    available: number;
}
interface ClassCardProps {
  instructor: {
    name: string;
    avatar: string;
    rating: number;
  };
  date: string;
  duration: number;
  tags: string[];
  slots: Slot[];
  availableCourts: number;
}

const SlotIcon = ({type, available, price}: Slot) => {
    if (type === 'instructor' && available === 0) {
        return (
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                    <Avatar className='h-8 w-8'>
                        <AvatarImage src="https://placehold.co/40x40.png" alt="instructor" data-ai-hint="instructor photo" />
                        <AvatarFallback>I</AvatarFallback>
                    </Avatar>
                     <div className="flex items-center gap-1 text-muted-foreground">
                        {[...Array(4)].map((_, i) => <div key={i} className="h-4 w-4 rounded-full border border-dashed" />)}
                    </div>
                </div>
                 <span className="font-semibold text-foreground">{price.toFixed(2)} € p.p.</span>
            </div>
        )
    }
    
    return (
        <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1">
                {[...Array(available)].map((_, i) => <PlusCircle key={i} className="h-5 w-5 text-green-500" />)}
                {[...Array(4 - available)].map((_, i) => <div key={i} className="h-5 w-5" />)}
            </div>
             <span className="font-semibold text-foreground">{price.toFixed(2)} € p.p.</span>
        </div>
    )
}

export function ClassCard({
  instructor,
  date,
  duration,
  tags,
  slots,
  availableCourts
}: ClassCardProps) {
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
                {instructor.name}
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
                <span className="font-bold text-xl text-foreground">{date.split(" ")[1].split(":")[0]}</span>
                <span className="text-xs uppercase">{date.split(" ")[0].slice(0,3)}<br/>AGO</span>
                <Separator orientation="vertical" className="h-8 mx-2" />
                 <div>
                    <p className="font-semibold text-foreground">{date.split(" ")[1]} - {date.split(" ")[2]}</p>
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{duration} min</span>
                    </div>
                 </div>
            </div>
            <Button variant="ghost" size="icon">
                <Share2 className="h-5 w-5" />
            </Button>
        </div>
         <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="font-normal">{tag}</Badge>
            ))}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-2 p-4 pt-0">
        {slots.map((slot, i) => (
            <SlotIcon key={i} {...slot} />
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
