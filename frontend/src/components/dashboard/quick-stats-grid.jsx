import { Activity, MessageSquare, Users, Vote } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const iconMap = {
  students: Users,
  votes: Vote,
  feedback: MessageSquare,
  groups: Activity
};

function QuickStatsGrid({ stats }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = iconMap[stat.id] || Activity;

        return (
          <Card key={stat.id} className="transition-transform duration-200 hover:-translate-y-1">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-muted">{stat.label}</CardTitle>
                <div className="rounded-lg border border-border bg-slate-800/40 p-2">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-foreground">{stat.value.toLocaleString()}</p>
              <p className="mt-2 text-xs font-medium text-success">{stat.delta} vs yesterday</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default QuickStatsGrid;
