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

function GroupVotingSection({ items, onVote, onCreatePoll, mealTypes = [] }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPollName, setNewPollName] = useState('');
  const [mealType, setMealType] = useState(mealTypes[0] || 'BREAKFAST');

  const totalVotes = useMemo(
    () => items.reduce((acc, item) => acc + item.upVotes + item.downVotes, 0),
    [items]
  );

  const handleCreatePoll = () => {
    if (!newPollName.trim()) {
      return;
    }

    onCreatePoll({ itemName: newPollName.trim(), mealType });
    setNewPollName('');
    setIsDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Group Voting</CardTitle>
            <CardDescription>Track food preference trends in real time</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="neutral">{totalVotes} votes today</Badge>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" size="sm">
                  <Plus className="h-4 w-4" />
                  New Poll
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Food Poll</DialogTitle>
                  <DialogDescription>
                    Add a new food item for students to vote on.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <select
                    value={mealType}
                    onChange={(event) => setMealType(event.target.value)}
                    className="flex h-10 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground"
                  >
                    {mealTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <Input
                    value={newPollName}
                    onChange={(event) => setNewPollName(event.target.value)}
                    placeholder="Example: Lemon Rice"
                  />
                  <div className="flex justify-end gap-2">
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleCreatePoll}>Create Poll</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <EmptyState
            title="No active food votes"
            description="Create a poll to start collecting student preferences."
          />
        ) : null}

        {items.map((item) => {
          const count = item.upVotes + item.downVotes;
          const percent = count === 0 ? 0 : Math.round((item.upVotes / count) * 100);

          return (
            <div key={item.id} className="rounded-xl border border-border bg-slate-800/20 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold text-foreground">{item.item}</p>
                <Badge variant="neutral">{count} responses</Badge>
              </div>

              {item.mealType ? (
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{item.mealType}</p>
              ) : null}

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
