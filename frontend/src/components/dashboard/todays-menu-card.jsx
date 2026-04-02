import { Clock4 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const mealLabels = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  SNACKS: 'Evening Snacks',
  DINNER: 'Dinner',
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snacks: 'Evening Snacks',
  dinner: 'Dinner'
};

function TodaysMenuCard({ menu }) {
  const entries = Object.entries(menu || {});

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Today's Menu</CardTitle>
            <CardDescription>Current hostel mess plan for today</CardDescription>
          </div>
          <Badge variant="neutral" className="gap-1">
            <Clock4 className="h-3.5 w-3.5" />
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-slate-800/20 p-4 text-sm text-muted">
            No meal updates posted yet for today.
          </p>
        ) : null}

        {entries.map(([mealKey, dishes]) => {
          const itemList = Array.isArray(dishes) ? dishes : [];
          return (
            <div key={mealKey} className="rounded-xl border border-border bg-slate-800/30 p-4">
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">{mealLabels[mealKey] || mealKey}</p>
              {itemList.length === 0 ? (
                <p className="text-sm text-muted">No items posted.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {itemList.map((dish) => (
                    <Badge key={dish} variant="default">
                      {dish}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default TodaysMenuCard;
