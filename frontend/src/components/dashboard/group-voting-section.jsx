import { useMemo, useState } from 'react';
import { Plus, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import EmptyState from '@/components/dashboard/empty-state';
import { getFoodImageUrl } from '@/data/food-options';

const COMPLAINT_REASONS = [
  'Poor taste',
  'Not cooked well',
  'Too oily',
  'Too spicy or salty',
  'Cold food',
  'Hygiene issue',
  'Repeated menu',
  'Other'
];

const CATEGORY_LABELS = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  SNACKS: 'Snacks',
  DINNER: 'Dinner'
};

function GroupVotingSection({ items, onVote, onCreatePoll, mealTypes = [], meals = {}, hideComplaintButton = false }) {
  const [selectedCategory, setSelectedCategory] = useState('BREAKFAST');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [comment, setComment] = useState('');
  const [failedImages, setFailedImages] = useState(new Set());

  // Get actual uploaded meals instead of predefined options
  const complaintFoodCards = useMemo(() => {
    const mealData = meals[selectedCategory] || {};
    const foodItems = mealData.items || [];
    
    return foodItems.map((foodItem) => ({
      id: `${selectedCategory}-${foodItem}`,
      mealType: selectedCategory,
      foodItem
    }));
  }, [selectedCategory, meals]);

  const totalVotes = useMemo(
    () => items.reduce((acc, item) => acc + item.upVotes + item.downVotes, 0),
    [items]
  );

  const visibleVoteItems = useMemo(() => {
    return items.filter((item) => item.mealType === selectedCategory);
  }, [items, selectedCategory]);

  const toggleReason = (reason) => {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((entry) => entry !== reason) : [...prev, reason]
    );
  };

  const handleImageError = (foodId) => {
    setFailedImages((prev) => new Set([...prev, foodId]));
  };

  const openComplaintDialog = (foodCard) => {
    setSelectedFood(foodCard);
    setSelectedReasons([]);
    setComment('');
    setIsDialogOpen(true);
  };

  const handleRaiseComplaint = () => {
    if (!selectedFood || selectedReasons.length === 0) {
      return;
    }

    onCreatePoll({
      mealType: selectedFood.mealType,
      foodItem: selectedFood.foodItem,
      reasons: selectedReasons,
      comment: comment.trim()
    });

    setIsDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Group Voting</CardTitle>
            <CardDescription>Capture food preference with transparent voting</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="neutral">{totalVotes} votes today</Badge>
            {!hideComplaintButton && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary" size="sm">
                    <Plus className="h-4 w-4" />
                    Raise Complaint
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Raise Complaint</DialogTitle>
                    <DialogDescription>
                      Select why the food was not good. Other students can upvote/downvote once.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    {selectedFood ? (
                      <div className="rounded-xl border border-border bg-slate-900/20 p-3">
                        <p className="text-sm font-semibold text-foreground">{selectedFood.foodItem}</p>
                        <p className="text-xs text-muted">Meal: {selectedFood.mealType}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted">Pick a food card first to raise complaint.</p>
                    )}

                    <div className="grid gap-2 sm:grid-cols-2">
                      {COMPLAINT_REASONS.map((reason) => (
                        <label
                          key={reason}
                          className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
                        >
                          <input
                            type="checkbox"
                            checked={selectedReasons.includes(reason)}
                            onChange={() => toggleReason(reason)}
                          />
                          <span>{reason}</span>
                        </label>
                      ))}
                    </div>

                    <Input
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      placeholder="Optional comment"
                    />
                    <div className="flex justify-end gap-2">
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button onClick={handleRaiseComplaint} disabled={!selectedFood || selectedReasons.length === 0}>
                        Raise Complaint
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          {['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'].map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'border-primary bg-primary/15 text-foreground'
                  : 'border-border bg-card text-muted hover:text-foreground'
              }`}
            >
              {CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!hideComplaintButton && complaintFoodCards.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {complaintFoodCards.map((card) => {
              const imageLoaded = !failedImages.has(card.id);
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => openComplaintDialog(card)}
                  className="overflow-hidden rounded-xl border border-border bg-slate-900/20 text-left transition-all hover:-translate-y-0.5 hover:border-primary/60"
                >
                  {imageLoaded && (
                    <img
                      src={getFoodImageUrl(card.foodItem)}
                      alt={card.foodItem}
                      loading="lazy"
                      onError={() => handleImageError(card.id)}
                      className="h-28 w-full object-cover"
                    />
                  )}
                  <div className={`${imageLoaded ? 'p-3' : 'p-4'}`}>
                    <p className={`font-semibold text-foreground ${imageLoaded ? 'text-sm' : 'text-base'}`}>
                      {card.foodItem}
                    </p>
                    {imageLoaded && <p className="text-xs text-muted">{card.mealType}</p>}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {(!hideComplaintButton && complaintFoodCards.length === 0 || hideComplaintButton) && visibleVoteItems.length === 0 && (
          <EmptyState
            title="No active food votes"
            description="Create a poll to start collecting student preferences."
          />
        )}

        {visibleVoteItems.map((item) => {
          const count = item.upVotes + item.downVotes;
          const percent = count === 0 ? 0 : Math.round((item.upVotes / count) * 100);
          const imageId = `vote-${item.id}`;
          const imageLoaded = !failedImages.has(imageId);

          return (
            <div key={item.id} className="rounded-xl border border-border bg-slate-800/20 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {imageLoaded && (
                    <img
                      src={getFoodImageUrl(item.item)}
                      alt={item.item}
                      loading="lazy"
                      onError={() => handleImageError(imageId)}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-foreground">{item.item}</p>
                    <p className="text-xs text-muted">{item.mealType}</p>
                  </div>
                </div>
                <Badge variant="neutral">{count} responses</Badge>
              </div>

              <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-700">
                <div className="h-full rounded-full bg-success transition-all duration-300" style={{ width: `${percent}%` }} />
              </div>

              <div className="mb-4 flex items-center justify-between text-xs text-muted">
                <span>{percent}% positive</span>
                <span>{100 - percent}% negative</span>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button variant="success" onClick={() => onVote(item.id, 'AGREE')}>
                  <ThumbsUp className="h-4 w-4" />
                  Upvote ({item.upVotes})
                </Button>
                <Button variant="danger" onClick={() => onVote(item.id, 'DISAGREE')}>
                  <ThumbsDown className="h-4 w-4" />
                  Downvote ({item.downVotes})
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default GroupVotingSection;
