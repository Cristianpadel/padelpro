import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";

export default function MatchDayPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <header>
        <h1 className="font-headline text-3xl font-semibold">Match-Day</h1>
        <p className="text-muted-foreground">
          Sign up for special events and get matched with other players.
        </p>
      </header>
      <main className="flex flex-1 items-center justify-center">
        <Card className="w-full max-w-lg text-center shadow-lg">
          <CardHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Trophy className="h-6 w-6" />
            </div>
            <CardTitle className="mt-4 font-headline text-2xl">Sunday Match-Day</CardTitle>
            <CardDescription>
              Sign-ups are currently open! A lottery system will create the matches automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 font-bold text-lg">Next event starts in: 3d 4h 12m</p>
            <Button size="lg">Sign Up Now</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
