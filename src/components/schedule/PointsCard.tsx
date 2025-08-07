import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { History, Repeat, Star } from 'lucide-react';

export function PointsCard() {
  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Loyalty Points</CardTitle>
        <Star className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">1,234 pts</div>
        <p className="text-xs text-muted-foreground">
          Use them to book courts or join classes
        </p>
      </CardContent>
      <CardFooter className="flex-wrap gap-2">
        <Button size="sm" variant="outline">
          <Repeat className="mr-2 h-4 w-4" />
          Convert Balance
        </Button>
        <Button size="sm" variant="outline">
          <History className="mr-2 h-4 w-4" />
          History
        </Button>
      </CardFooter>
    </Card>
  );
}
