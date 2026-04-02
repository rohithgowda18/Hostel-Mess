function SelectedItemsBar({ items, onRemove, mealLabel }) {
  const selectedItems = Array.isArray(items) ? items : [];
  const label = mealLabel || 'meal';

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">Selected Items</h4>
        <span className="text-xs text-muted">{selectedItems.length} total</span>
      </div>

      {selectedItems.length === 0 ? (
        <p className="text-sm text-muted">No {label.toLowerCase()} items selected yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {selectedItems.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onRemove(item)}
              className="rounded-full border border-border bg-slate-900/30 px-3 py-1.5 text-xs text-foreground hover:border-danger hover:text-red-300"
            >
              {item} x
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export default SelectedItemsBar;
