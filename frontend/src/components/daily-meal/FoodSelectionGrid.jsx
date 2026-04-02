import { Badge } from '@/components/ui/badge';
import { getFoodImageUrl } from '@/data/food-options';

function FoodSelectionGrid({ foods, selectedItems, onToggle, mealLabel }) {
  const allFoods = Array.isArray(foods) ? foods : [];
  const label = mealLabel || 'Meal';

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Update {label}</h3>
          <p className="text-sm text-muted">Click food cards to select or remove</p>
        </div>
        <Badge variant="neutral">{selectedItems.length} selected</Badge>
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-4">
        {allFoods.map((food) => {
          const selected = selectedItems.includes(food);
          return (
            <button
              key={food}
              type="button"
              onClick={() => onToggle(food)}
              className={`overflow-hidden rounded-xl border text-left transition-all hover:-translate-y-0.5 ${
                selected
                  ? 'border-primary bg-primary/10 shadow-card'
                  : 'border-border bg-slate-900/20 hover:border-primary/50'
              }`}
            >
              <img
                src={getFoodImageUrl(food)}
                alt={food}
                loading="lazy"
                className="h-28 w-full object-cover"
              />
              <div className="p-3">
                <p className="text-sm font-semibold text-foreground">{food}</p>
                <p className="mt-1 text-xs text-muted">{selected ? 'Selected' : 'Tap to select'}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default FoodSelectionGrid;
