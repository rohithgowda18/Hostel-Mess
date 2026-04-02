import { Button } from '@/components/ui/button';

function UpdateBreakfastButton({ loading, disabled, onClick, mealLabel }) {
  const label = mealLabel || 'Meal';

  return (
    <div className="sticky bottom-0 z-10 rounded-xl bg-background/95 p-2 backdrop-blur md:static md:bg-transparent md:p-0">
      <Button className="w-full" onClick={onClick} disabled={disabled || loading}>
        {loading ? 'Updating...' : `Update ${label}`}
      </Button>
    </div>
  );
}

export default UpdateBreakfastButton;
