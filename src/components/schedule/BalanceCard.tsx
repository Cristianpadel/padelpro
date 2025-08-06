import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DollarSign, History } from 'lucide-react';

export function BalanceCard() {
  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Balance</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">€125.50</div>
        <p className="text-xs text-muted-foreground">Available to spend</p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button size="sm">Add Balance</Button>
        <Button size="sm" variant="outline">
          <History className="mr-2 h-4 w-4" />
          Movements
        </Button>
      </CardFooter>
    </Card