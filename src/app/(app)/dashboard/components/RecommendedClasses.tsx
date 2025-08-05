'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  recommendClasses,
  type RecommendClassesOutput,
} from '@/ai/flows/recommend-classes';
import { Lightbulb, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export function RecommendedClasses() {
  const [recommendations, setRecommendations] =
    useState<RecommendClassesOutput | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getRecommendations() {
      const mockUserInput = {
        bookingHistory: 'Beginner group classes, several friendly matches.',
        skillLevel: 2.5,
      };
      try {
        const result = await recommendClasses(mockUserInput);
        setRecommendations(result);
      } catch (error) {
        console.error('Failed to get recommendations:', error);
      } finally {
        setLoading(false);
      }
    }
    getRecommendations();
  }, []);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-400" />
          <CardTitle className="font-headline text-xl">
            Recommended For You
          </CardTitle>
        </div>
        <CardDescription>
          AI-powered suggestions based on your level and activity.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-8 w-4/5" />
          </div>
        ) : !recommendations ||
          recommendations.recommendedClasses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No recommendations available at the moment.
          </p>
        ) : (
          <ul className="space-y-3">
            {recommendations.recommendedClasses.map((rec, index) => (
              <li
                key={index}
                className="flex items-center justify-between gap-4 rounded-lg border bg-secondary/50 p-3 transition-colors hover:bg-secondary"
              >
                <p className="flex-1 text-sm font-medium">{rec}</p>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/activities">
                    View <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
