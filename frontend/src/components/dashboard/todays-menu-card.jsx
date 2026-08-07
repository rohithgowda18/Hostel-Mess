import { useState, useEffect } from 'react';
import { Clock4, Star, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { messApi } from '@/services/mess-api';

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

  const [ratings, setRatings] = useState({});
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingTarget, setRatingTarget] = useState(null); // { mealType, date }

  // Rating Form States
  const [ratingOverall, setRatingOverall] = useState(5);
  const [taste, setTaste] = useState(5);
  const [quality, setQuality] = useState(5);
  const [quantity, setQuantity] = useState(5);
  const [temperature, setTemperature] = useState(5);
  const [cleanliness, setCleanliness] = useState(5);
  const [presentation, setPresentation] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRatingsSummaries = async () => {
    const today = new Date().toISOString().split('T')[0];
    const summaries = {};
    for (const m of allMeals) {
      try {
        const sum = await messApi.getMealRatingsSummary(m.key, today);
        summaries[m.displayKey] = sum;
      } catch (err) {
        summaries[m.displayKey] = { averageOverall: 0, totalRatings: 0 };
      }
    }
    setRatings(summaries);
  };

  useEffect(() => {
    fetchRatingsSummaries();
  }, [menu]);

  const openRatingForm = (mealType) => {
    const today = new Date().toISOString().split('T')[0];
    setRatingTarget({ mealType, date: today });
    setShowRatingModal(true);
  };

  const handleRateSubmit = async (e) => {
    e.preventDefault();
    if (!ratingTarget) return;

    setSubmitting(true);
    try {
      await messApi.submitMealRating({
        mealType: ratingTarget.mealType,
        date: ratingTarget.date,
        ratingOverall,
        taste,
        quality,
        quantity,
        temperature,
        cleanliness,
        presentation,
        reviewText
      });
      setShowRatingModal(false);
      fetchRatingsSummaries();
      alert('Thank you for rating today\'s meal!');
    } catch (err) {
      console.error(err);
      alert('Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Reorder meals: current meal first
  const mealOrder = [...allMeals].sort((a, b) => {
    const aIsCurrent = a.displayKey === currentMealKey;
    const bIsCurrent = b.displayKey === currentMealKey;
    if (aIsCurrent) return -1;
    if (bIsCurrent) return 1;
    return 0;
  });

  const renderStarsSelector = (val, setVal) => (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setVal(star)}
          className={`text-lg transition-colors ${star <= val ? 'text-amber-400' : 'text-slate-600'}`}
        >
          ★
        </button>
      ))}
    </div>
  );

  return (
    <>
      <Card className="h-full bg-slate-900/40 border-border">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Today's Menu</CardTitle>
              <CardDescription>Current hostel mess plan for today</CardDescription>
            </div>
            <Badge variant="neutral" className="gap-1 bg-slate-950">
              <Clock4 className="h-3.5 w-3.5 text-primary" />
              Live Sync
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {mealOrder.map(({ key, displayKey }) => {
            const items = menu?.[displayKey] || [];
            const isCurrent = displayKey === currentMealKey;
            const summary = ratings[displayKey] || { averageOverall: 0, totalRatings: 0 };

            return (
              <div
                key={displayKey}
                className={`rounded-xl border p-4 transition-all ${
                  isCurrent
                    ? 'border-primary bg-gradient-to-br from-primary/15 to-primary/5 ring-2 ring-primary/30'
                    : 'border-border bg-slate-800/20'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <p
                    className={`uppercase tracking-wide ${
                      isCurrent ? 'text-lg font-bold text-primary' : 'text-xs font-semibold text-muted'
                    }`}
                  >
                    {mealLabels[key]}
                  </p>
                  {summary.totalRatings > 0 ? (
                    <div className="flex items-center gap-1 text-xs text-amber-400 font-semibold bg-slate-950/40 px-2 py-0.5 rounded-lg border border-border/40">
                      <Star className="h-3.5 w-3.5 fill-amber-400" />
                      <span>{summary.averageOverall}</span>
                      <span className="text-muted text-[10px]">({summary.totalRatings})</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted">No ratings</span>
                  )}
                </div>

                {items.length === 0 ? (
                  <p className="text-xs text-muted mb-3">No items posted.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {items.map((dish) => (
                      <Badge
                        key={dish}
                        variant={isCurrent ? 'default' : 'secondary'}
                        className={isCurrent ? 'px-2.5 py-1.5 text-xs font-medium' : 'text-xs'}
                      >
                        {dish}
                      </Badge>
                    ))}
                  </div>
                )}

                {items.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openRatingForm(key)}
                    className="w-full text-xs gap-1 border-border bg-slate-950/20 hover:bg-slate-950/50"
                  >
                    <Star className="h-3.5 w-3.5 text-amber-400" /> Rate Meal
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Star Ratings Submission Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md bg-slate-900 border-border max-h-[90vh] overflow-y-auto p-4 space-y-4">
            <CardHeader className="p-0">
              <CardTitle className="text-lg">Rate {mealLabels[ratingTarget?.mealType]}</CardTitle>
              <CardDescription>Only one rating allowed per user per meal</CardDescription>
            </CardHeader>
            <form onSubmit={handleRateSubmit} className="space-y-4">
              <div className="space-y-2 border-b border-border/40 pb-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-foreground">Overall Satisfaction</span>
                  {renderStarsSelector(ratingOverall, setRatingOverall)}
                </div>
              </div>
              <div className="space-y-2 text-xs space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted">Taste & Flavour</span>
                  {renderStarsSelector(taste, setTaste)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted">Ingredient Quality</span>
                  {renderStarsSelector(quality, setQuality)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted">Portion Quantity</span>
                  {renderStarsSelector(quantity, setQuantity)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted">Serving Temperature</span>
                  {renderStarsSelector(temperature, setTemperature)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted">Hygiene & Cleanliness</span>
                  {renderStarsSelector(cleanliness, setCleanliness)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted">Food Presentation</span>
                  {renderStarsSelector(presentation, setPresentation)}
                </div>
              </div>
              <div className="space-y-1.5">
                <span className="text-xs text-muted">Review Comment (Optional)</span>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Tell us what you liked or how we can improve..."
                  className="w-full rounded-lg border border-border bg-slate-950 p-2.5 text-xs text-foreground min-h-[60px]"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowRatingModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Rating'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}

export default TodaysMenuCard;
