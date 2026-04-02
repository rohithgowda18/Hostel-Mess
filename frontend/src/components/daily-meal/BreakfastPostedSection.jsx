import { Badge } from '@/components/ui/badge';

function BreakfastPostedSection({ items, mealLabel }) {
  const postedItems = Array.isArray(items) ? items : [];
  const label = mealLabel || 'Meal';

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Today's {label}</h3>
          <p className="text-sm text-muted">Currently posted items for students</p>
        </div>
        <Badge variant="neutral">{postedItems.length} posted</Badge>
      </div>

      {postedItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-slate-800/20 p-4 text-sm text-muted">
          No {label.toLowerCase()} items posted yet.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {postedItems.map((item) => (
            <div key={item} className="rounded-xl border border-border bg-slate-900/25 p-4">
              <p className="text-base font-semibold text-foreground">{item}</p>
              <p className="mt-1 text-xs text-muted">Posted for today</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default BreakfastPostedSection;
