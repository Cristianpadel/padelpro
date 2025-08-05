import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Filters } from './components/Filters';
import { ClassCard } from './components/ClassCard';
import { MatchCard } from './components/MatchCard';

const sampleClasses = [
  {
    instructor: {
      name: 'Carlos Moya',
      avatar: 'https://placehold.co/40x40.png',
    },
    time: '09:00 - 10:00',
    level: 2.5,
    slots: { '1': 20, '2': 18, '3': 15, '4': 12 },
    availableSlots: 4,
  },
  {
    instructor: {
      name: 'Sofia Kenin',
      avatar: 'https://placehold.co/40x40.png',
    },
    time: '10:00 - 11:00',
    level: 4.0,
    slots: { '1': 25, '2': 22, '3': 20, '4': 18 },
    availableSlots: 2,
  },
  {
    instructor: {
      name: 'Rafa Nadal',
      avatar: 'https://placehold.co/40x40.png',
    },
    time: '18:00 - 19:00',
    level: 6.0,
    slots: { '1': 30, '2': 28, '3': 25, '4': 22 },
    availableSlots: 1,
  },
];

const sampleMatches = [
  {
    level: '2.5 - 3.0',
    time: '17:00 - 18:30',
    players: [
      { name: 'Alice', avatar: 'https://placehold.co/40x40.png' },
      { name: 'Bob', avatar: 'https://placehold.co/40x40.png' },
    ],
  },
  {
    level: '4.0 - 4.5',
    time: '19:00 - 20:30',
    players: [
      { name: 'Charlie', avatar: 'https://placehold.co/40x40.png' },
      { name: 'David', avatar: 'https://placehold.co/40x40.png' },
      { name: 'Eve', avatar: 'https://placehold.co/40x40.png' },
    ],
  },
  {
    level: '1.5 - 2.0',
    time: '20:00 - 21:30',
    players: [{ name: 'Frank', avatar: 'https://placehold.co/40x40.png' }],
  },
];

export default function ActivitiesPage() {
  return (
    <div className="flex h-full">
      <Filters />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <header className="mb-6">
          <h1 className="font-headline text-3xl font-semibold">Activities</h1>
          <p className="text-muted-foreground">
            Book classes and join matches. First to fill is confirmed!
          </p>
        </header>
        <Tabs defaultValue="classes" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
          </TabsList>
          <TabsContent value="classes">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {sampleClasses.map((classInfo, index) => (
                <ClassCard key={index} {...classInfo} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="matches">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {sampleMatches.map((matchInfo, index) => (
                <MatchCard key={index} {...matchInfo} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
