import { useState, useEffect } from 'react';
import { messApi } from '@/services/mess-api';
import { getUser } from '@/services/auth-service';
import {
  Star,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const MEAL_SLOTS = [
  { key: 'BREAKFAST', name: 'Breakfast', time: '07:30 – 09:30' },
  { key: 'LUNCH', name: 'Lunch', time: '12:30 – 14:30' },
  { key: 'SNACKS', name: 'Snacks', time: '16:30 – 17:30' },
  { key: 'DINNER', name: 'Dinner', time: '19:30 – 21:30' }
];

export default function FeedbackPage() {
  const currentUser = getUser() || {};
  const [selectedSlot, setSelectedSlot] = useState('LUNCH');
  const [ratingValue, setRatingValue] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittedRating, setSubmittedRating] = useState(null);
  const [summary, setSummary] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchRatingAndSummary = async () => {
      try {
        const [myRate, rateSummary] = await Promise.all([
          messApi.getMyMealRating(selectedSlot, todayStr).catch(() => null),
          messApi.getMealRatingsSummary(selectedSlot, todayStr).catch(() => null)
        ]);

        if (myRate && myRate.ratingOverall) {
          setSubmittedRating(myRate.ratingOverall);
          setRatingValue(myRate.ratingOverall);
          setComment(myRate.reviewText || '');
        } else {
          setSubmittedRating(null);
          setRatingValue(5);
          setComment('');
        }

        if (rateSummary) setSummary(rateSummary);
      } catch (err) {
        console.error('Failed to load ratings:', err);
      }
    };

    fetchRatingAndSummary();
  }, [selectedSlot, todayStr]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');

    try {
      const payload = {
        mealType: selectedSlot,
        date: todayStr,
        ratingOverall: ratingValue,
        reviewText: comment.trim(),
        taste: ratingValue,
        quality: ratingValue,
        quantity: ratingValue,
        temperature: ratingValue,
        cleanliness: ratingValue,
        presentation: ratingValue
      };

      await messApi.submitMealRating(payload);
      setSubmittedRating(ratingValue);
      setSuccessMsg(`Your rating for ${selectedSlot.toLowerCase()} has been recorded!`);

      // Refresh summary
      const updatedSummary = await messApi.getMealRatingsSummary(selectedSlot, todayStr).catch(() => null);
      if (updatedSummary) setSummary(updatedSummary);
    } catch (err) {
      console.error('Failed to submit rating:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Rate Your Meal
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Share your dining rating to help administrators monitor quality and taste.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/40 text-green-800 dark:text-green-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Eligible Meal Slot Cards */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Select Meal to Rate
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {MEAL_SLOTS.map((slot) => {
            const isSelected = selectedSlot === slot.key;
            return (
              <button
                key={slot.key}
                type="button"
                onClick={() => setSelectedSlot(slot.key)}
                className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-teal-50 text-teal-900 border-teal-600 dark:bg-teal-950/60 dark:text-teal-200 dark:border-teal-500 font-bold shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="block text-xs font-bold">{slot.name}</span>
                <span className="block text-[10px] text-slate-400 font-mono">{slot.time}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Rating Form Card */}
      <Card className="p-5 space-y-4 border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {selectedSlot} • Today
            </h2>
            <p className="text-[11px] text-slate-400">
              {submittedRating ? `You rated this meal ${submittedRating}/5` : 'Rate overall meal satisfaction'}
            </p>
          </div>
          {submittedRating && (
            <Badge variant="verified" className="text-[11px] font-bold">
              Rated {submittedRating}/5
            </Badge>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1–5 Star Rating Control */}
          <div className="flex flex-col items-center justify-center py-2 space-y-2">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = (hoverRating || ratingValue) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRatingValue(star)}
                    className="p-1 transition-transform active:scale-95 cursor-pointer focus:outline-none"
                  >
                    <Star
                      className={`h-7 w-7 transition-colors ${
                        filled ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {ratingValue === 5
                ? '5/5 - Excellent'
                : ratingValue === 4
                ? '4/5 - Good'
                : ratingValue === 3
                ? '3/5 - Average'
                : ratingValue === 2
                ? '2/5 - Poor'
                : '1/5 - Very Poor'}
            </span>
          </div>

          {/* Optional Review Comment */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Optional Comment
            </label>
            <textarea
              rows={3}
              placeholder="Add specific feedback on food taste, warmth, or quantity..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700"
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-10 text-xs font-bold"
          >
            {submitting ? 'Submitting...' : submittedRating ? 'Update Rating' : 'Submit Rating'}
          </Button>
        </form>
      </Card>

      {/* Community Summary for this meal */}
      {summary && summary.totalRatings > 0 && (
        <Card className="p-4 space-y-2 bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Community Rating for {selectedSlot}
            </span>
            <span className="font-bold text-teal-800 dark:text-teal-300">
              ★ {summary.averageOverall} / 5.0 ({summary.totalRatings} ratings)
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}
