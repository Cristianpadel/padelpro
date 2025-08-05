import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";

export default function BookWithPointsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <header>
        <h1 className="font-headline text-3xl font-semibold">Book with Points</h1>
        <p className="text-muted-foreground">
          Use your loyalty points to book courts or join last-minute classes.
        </p>
      </header>
      <main className="flex flex-1 items-center justify-center">
        <Card className="w-full max-w-lg text-center shadow-lg">
            <CardHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400/10 text-yellow-500">
                    <Star className="h-6 w-6" />
                </div>
                <CardTitle className="mt-4 font-headline text-2xl">Spend Your Points</CardTitle>
                <CardDescription>You have <span className="font-bold text-primary">1,234 points</span> to use.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button size="lg" className="w-full">Book a Released Slot</Button>
                <Button size="lg" variant="outline" className="w-full">Book a Full Court</Button>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
