import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, CheckCircle, Clock, Users, XCircle } from 'lucide-react';

const upcomingActivities = [
  {
    type: 'Class',
    title: 'Advanced Technique',
    instructor: 'John Doe',
    date: 'Tomorrow at 18:00',
    status: 'Pre-booked',
    canCancel: true,
  },
  {
    type: 'Match',
    title: 'Friendly Match',
    level: '3.0 - 3.5',
    date: 'Tomorrow at 20:00',
    status: 'Confirmed',
    canCancel: false,
  },
];

const historyActivities = [
  {
    type: 'Match',
    title: 'Evening Match',
    level: '3.0 - 3.5',
    date: '2 days ago',
    status: 'Completed',
  },
  {
    type: 'Class',
    title: 'Beginner Basics',
    instructor: 'Jane Smith',
    date: 'Last week',
    status: 'Completed',
  },
  {
    type: 'Class',
    title: 'Serve Practice',
    instructor: 'John Doe',
    date: 'Last month',
    status: 'Cancelled',
  },
];

export function AgendaTabs() {
  return (
    <Tabs defaultValue="upcoming" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      <TabsContent value="upcoming">
        <Card className="shadow-lg">
          <CardContent className="space-y-4 p-4 md:p-6">
            {upcomingActivities.length > 0 ? (
              upcomingActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center"
                >
                  <div className="flex flex-1 flex-col">
                    <p className="font-semibold">{activity.title}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {activity.type === 'Class' ? (
                        <Users className="h-4 w-4" />
                      ) : (
                        <Users className="h-4 w-4" />
                      )}
                      <span>
                        {activity.type === 'Class'
                          ? activity.instructor
                          : `Level ${activity.level}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{activity.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        activity.status === 'Confirmed'
                          ? 'text-green-600'
                          : 'text-blue-600'
                      }`}
                    >
                      {activity.status}
                    </span>
                    {activity.canCancel && (
                      <Button variant="destructive" size="sm">
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                No upcoming activities.
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="history">
        <Card className="shadow-lg">
          <CardContent className="space-y-4 p-4 md:p-6">
            {historyActivities.map((activity, index) => (
              <div
                key={index}
                className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center"
              >
                <div className="flex-1">
                  <p className="font-semibold">{activity.title}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{activity.date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activity.status === 'Completed' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm font-medium">{activity.status}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>
    