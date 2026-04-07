import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getFoodImageUrl } from '@/data/food-options';

function FoodSelectionGrid({ foods, selectedItems, onToggle, mealLabel, disabled }) {
  const allFoods = Array.isArray(foods) ? foods : [];
  const label = mealLabel || 'Meal';
  const [customFood, setCustomFood] = useState('');
  const [failedImages, setFailedImages] = useState(new Set());

  const handleAddCustomFood = (e) => {
    e.preventDefault();
    if (customFood.trim() && !selectedItems.includes(customFood.trim())) {
      onToggle(customFood.trim());
      setCustomFood('');
    }
  };

  const handleImageError = (food) => {
    setFailedImages((prev) => new Set([...prev, food]));
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Update {label}</h3>
          <p className="text-sm text-muted">Add custom food items to today's menu</p>
        </div>
        <Badge variant="neutral">{selectedItems.length} added</Badge>
      </div>

      <div className="mb-5 flex gap-2">
        <Input
          type="text"
          placeholder="e.g., Biryani, Butter Chicken..."
          value={customFood}
          onChange={(e) => setCustomFood(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddCustomFood(e)}
          disabled={disabled}
          className="flex-1"
        />
        <Button
          onClick={handleAddCustomFood}
          disabled={disabled || !customFood.trim() || selectedItems.includes(customFood.trim())}
          size="sm"
          className="gap-1"
        >
          <Plus size={16} />
          Add
        </Button>
      </div>

      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedItems.map((item) => (
            <div
              key={item}
              className="inline-flex items-center gap-2 rounded-full border border-primary bg-primary/10 px-3 py-1.5"
            >
              <span className="text-sm font-semibold text-foreground">{item}</span>
              <button
                type="button"
                onClick={() => onToggle(item)}
                className="hover:text-danger"
                aria-label={`Remove ${item}`}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {allFoods.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-sm font-semibold text-muted">Suggested Items:</p>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-4">
            {allFoods.map((food) => {
              const selected = selectedItems.includes(food);
              const imageLoaded = !failedImages.has(food);
              return (
                <button
                  key={food}
                  type="button"
                  onClick={() => onToggle(food)}
                  disabled={disabled}
                  className={`overflow-hidden rounded-xl border text-left transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${
                    selected
                      ? 'border-primary bg-primary/10 shadow-card'
                      : 'border-border bg-slate-900/20 hover:border-primary/50'
                  }`}
                >
                  {imageLoaded && (
                    <img
                      src={getFoodImageUrl(food)}
                      alt={food}
                      loading="lazy"
                      onError={() => handleImageError(food)}
                      className="h-28 w-full object-cover"
                    />
                  )}
                  <div className={`${imageLoaded ? 'p-3' : 'p-4'}`}>
                    <p className={`font-semibold text-foreground ${imageLoaded ? 'text-sm' : 'text-base'}`}>
                      {food}
                    </p>
                    {imageLoaded && (
                      <p className="mt-1 text-xs text-muted">{selected ? 'Added' : 'Tap to add'}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

export default FoodSelectionGrid;
