import { BalanceCard } from './components/BalanceCard';
import { PointsCard } from './components/PointsCard';
import { RecommendedClasses } from './components/RecommendedClasses';
import { AgendaTabs } from './components/AgendaTabs';

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <header>
        <h1 className="font-headline text-3xl font-semibold">My Agenda</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s a summary of your account and activities.
        </p>
      </header>
      <main className="flex flex-1 flex-col gap-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <BalanceCard />
          <PointsCard />
        </div>
        <div className="grid gap-6">
          <RecommendedClasses />
        </div>
        <div className="grid gap-6">
          <AgendaTabs />
        </div>
      </main>
    </div>
  );
}
