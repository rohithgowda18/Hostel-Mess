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

const mealKeyMap = {
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  SNACKS: 'snacks',
  DINNER: 'dinner'
};

const allMeals = [
  { key: 'BREAKFAST', displayKey: 'breakfast' },
  { key: 'LUNCH', displayKey: 'lunch' },
  { key: 'SNACKS', displayKey: 'snacks' },
  { key: 'DINNER', displayKey: 'dinner' }
];

function TodaysMenuCard({ menu, currentMeal }) {
  const currentMealKey = currentMeal ? mealKeyMap[currentMeal] : null;

  // Reorder meals: current meal first, then others
  const mealOrder = allMeals.sort((a, b) => {
    const aIsCurrent = a.displayKey === currentMealKey;
    const bIsCurrent = b.displayKey === currentMealKey;
    
    if (aIsCurrent) return -1;
    if (bIsCurrent) return 1;
    return 0;
  });

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
        {mealOrder.map(({ key, displayKey }) => {
          const items = menu?.[displayKey] || [];
          const isCurrent = displayKey === currentMealKey;

          return (
            <div
              key={displayKey}
              className={`rounded-xl border p-4 transition-all ${
                isCurrent
                  ? 'border-primary bg-gradient-to-br from-primary/15 to-primary/5 ring-2 ring-primary/30'
                  : 'border-border bg-slate-800/20'
              }`}
            >
              <p
                className={`mb-2 uppercase tracking-wide ${
                  isCurrent
                    ? 'text-lg font-bold text-primary'
                    : 'text-xs font-semibold text-muted'
                }`}
              >
                {mealLabels[key]}
              </p>
              {items.length === 0 ? (
                <p className="text-sm text-muted">No items posted.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {items.map((dish) => (
                    <Badge
                      key={dish}
                      variant={isCurrent ? 'default' : 'secondary'}
                      className={isCurrent ? 'px-2.5 py-1.5' : ''}
                    >
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
