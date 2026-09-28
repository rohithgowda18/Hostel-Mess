import { useState, useEffect } from 'react';
import { getUser } from '@/services/auth-service';
import {
  Vote,
  Sparkles,
  CheckCircle2,
  Calendar,
  Clock,
  Plus,
  Users,
  AlertCircle,
  BarChart3,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';

const INITIAL_POLLS = [
  {
    id: 'poll-weekend-special',
    title: 'WEEKEND SPECIAL DINNER',
    description: 'What special feast should the hostel mess prepare for Saturday dinner?',
    mealSlot: 'Saturday Dinner (7:30 PM)',
    endDate: 'Friday, 11:59 PM',
    status: 'ACTIVE',
    totalVotes: 824,
    options: [
      { id: 'opt-1', label: 'Hyderabadi Paneer Dum Biryani & Mirchi Ka Salan', votes: 346, percentage: 42 },
      { id: 'opt-2', label: 'Wood-fired Style Pizza & Garlic Breadsticks', votes: 222, percentage: 27 },
      { id: 'opt-3', label: 'Grand South Indian Thali (12 items & Payasam)', votes: 156, percentage: 19 },
      { id: 'opt-4', label: 'Indo-Chinese Fried Rice, Manchurian & Spring Rolls', votes: 100, percentage: 12 }
    ]
  },
  {
    id: 'poll-breakfast-change',
    title: 'BREAKFAST BEVERAGE ROTATION',
    description: 'Vote on adding Cold Coffee & Badam Milk twice a week during breakfast service.',
    mealSlot: 'Weekday Breakfast',
    endDate: 'In 3 days',
    status: 'ACTIVE',
    totalVotes: 512,
    options: [
      { id: 'bev-1', label: 'Yes, add Cold Coffee on Tue & Badam Milk on Thu', votes: 374, percentage: 73 },
      { id: 'bev-2', label: 'No, retain standard Masala Chai & Filter Coffee', votes: 138, percentage: 27 }
    ]
  }
];

export default function PollsPage() {
  const currentUser = getUser() || {};
  const isAdmin = currentUser.role === 'ADMIN';

  const [polls, setPolls] = useState(() => {
    const saved = localStorage.getItem('hostel_mess_polls');
    return saved ? JSON.parse(saved) : INITIAL_POLLS;
  });

  const [userVotes, setUserVotes] = useState(() => {
    const saved = localStorage.getItem(`user_votes_${currentUser.email || 'guest'}`);
    return saved ? JSON.parse(saved) : {};
  });

  const [selectedOption, setSelectedOption] = useState({});
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newSlot, setNewSlot] = useState('Weekend Special');
  const [newOptionsText, setNewOptionsText] = useState('Option 1\nOption 2\nOption 3');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    localStorage.setItem('hostel_mess_polls', JSON.stringify(polls));
  }, [polls]);

  useEffect(() => {
    if (currentUser.email) {
      localStorage.setItem(`user_votes_${currentUser.email}`, JSON.stringify(userVotes));
    }
  }, [userVotes, currentUser.email]);

  const handleVote = (pollId) => {
    const optId = selectedOption[pollId];
    if (!optId) return;

    setPolls((prev) =>
      prev.map((poll) => {
        if (poll.id !== pollId) return poll;
        const newTotal = poll.totalVotes + 1;
        const updatedOptions = poll.options.map((opt) => {
          const newVotes = opt.id === optId ? opt.votes + 1 : opt.votes;
          return {
            ...opt,
            votes: newVotes,
            percentage: Math.round((newVotes / newTotal) * 100)
          };
        });
        return {
          ...poll,
          totalVotes: newTotal,
          options: updatedOptions
        };
      })
    );

    setUserVotes((prev) => ({
      ...prev,
      [pollId]: optId
    }));

    setSuccessMsg('Your vote has been securely recorded!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleCreatePoll = (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    const parsedOptions = newOptionsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (parsedOptions.length < 2) {
      alert('Please provide at least two options.');
      return;
    }

    const newPoll = {
      id: `poll-${Date.now()}`,
      title: newQuestion.toUpperCase(),
      description: `Student consensus vote for ${newSlot}.`,
      mealSlot: newSlot,
      endDate: 'Closes in 48 hours',
      status: 'ACTIVE',
      totalVotes: 0,
      options: parsedOptions.map((label, idx) => ({
        id: `opt-${idx + 1}`,
        label,
        votes: 0,
        percentage: 0
      }))
    };

    setPolls([newPoll, ...polls]);
    setCreateModalOpen(false);
    setNewQuestion('');
    setNewOptionsText('Option 1\nOption 2\nOption 3');
    setSuccessMsg('New official poll created and broadcasted to students!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const closePoll = (pollId) => {
    if (!confirm('Are you sure you want to officially conclude this poll?')) return;
    setPolls((prev) =>
      prev.map((p) => (p.id === pollId ? { ...p, status: 'CLOSED' } : p))
    );
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-0 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Mess Consensus & Food Polls"
          subtitle="Democratic voting on weekly feasts, special menus, and student dining preferences."
          badge="Consensus Engine"
        />

        {isAdmin && (
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 shrink-0 shadow-sm"
          >
            <Plus className="h-4 w-4" /> Create Official Poll
          </Button>
        )}
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-sm font-semibold animate-in fade-in-0">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Polls Listing */}
      <div className="grid gap-6 md:grid-cols-2">
        {polls.map((poll) => {
          const hasVoted = Boolean(userVotes[poll.id]);
          const userChoiceId = userVotes[poll.id];

          return (
            <Card
              key={poll.id}
              className="border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
            >
              {poll.status === 'CLOSED' && (
                <div className="absolute top-3 right-3">
                  <Badge variant="neutral" className="text-[10px] font-bold">
                    CONCLUDED
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  <Sparkles className="h-4 w-4" />
                  <span>{poll.mealSlot}</span>
                </div>
                <CardTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                  {poll.title}
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {poll.description}
                </p>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                <div className="space-y-3">
                  {poll.options.map((opt) => {
                    const isSelected = selectedOption[poll.id] === opt.id;
                    const isVotedByMe = userChoiceId === opt.id;

                    return (
                      <div
                        key={opt.id}
                        onClick={() => {
                          if (!hasVoted && poll.status === 'ACTIVE') {
                            setSelectedOption({ ...selectedOption, [poll.id]: opt.id });
                          }
                        }}
                        className={`p-3 rounded-xl border transition-all ${
                          !hasVoted && poll.status === 'ACTIVE'
                            ? 'cursor-pointer hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            : ''
                        } ${
                          isSelected && !hasVoted
                            ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-blue-600'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30'
                        } ${
                          isVotedByMe
                            ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-1 ring-emerald-500'
                            : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 text-xs">
                          <div className="flex items-start gap-2.5">
                            {!hasVoted && poll.status === 'ACTIVE' ? (
                              <div
                                className={`h-4 w-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? 'border-blue-600 bg-blue-600 text-white'
                                    : 'border-slate-400'
                                }`}
                              >
                                {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                              </div>
                            ) : isVotedByMe ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                            ) : null}

                            <div>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">
                                {opt.label}
                              </p>
                              {hasVoted && (
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {opt.votes} votes • {opt.percentage}%
                                </p>
                              )}
                            </div>
                          </div>

                          {hasVoted && (
                            <span className="font-bold text-xs text-slate-700 dark:text-slate-300">
                              {opt.percentage}%
                            </span>
                          )}
                        </div>

                        {/* Progress Bar shown after voting or when closed */}
                        {hasVoted && (
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-2.5">
                            <div
                              className={`h-full transition-all duration-500 rounded-full ${
                                isVotedByMe ? 'bg-emerald-500' : 'bg-blue-600'
                              }`}
                              style={{ width: `${opt.percentage}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Footer with actions and status */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      <strong>{poll.totalVotes}</strong> voted
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {poll.endDate}
                    </span>
                  </div>

                  {!hasVoted && poll.status === 'ACTIVE' ? (
                    <Button
                      size="sm"
                      onClick={() => handleVote(poll.id)}
                      disabled={!selectedOption[poll.id]}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-8 px-4"
                    >
                      Submit Vote
                    </Button>
                  ) : (
                    <Badge variant="outline" className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40">
                      ✓ Vote Recorded
                    </Badge>
                  )}
                </div>

                {isAdmin && poll.status === 'ACTIVE' && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => closePoll(poll.id)}
                      className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      End & Finalize Results
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Admin Create Poll Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Vote className="h-5 w-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                  Create Democratic Mess Poll
                </h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePoll} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Poll Title / Question
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diwali Feast: North Indian or Royal Hyderabadi?"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Target Service Window
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunday Dinner (7:30 PM)"
                  value={newSlot}
                  onChange={(e) => setNewSlot(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Voting Choices (One per line)
                </label>
                <textarea
                  rows={4}
                  required
                  value={newOptionsText}
                  onChange={(e) => setNewOptionsText(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs font-mono"
                  placeholder="Paneer Butter Masala & Naan&#10;Chole Bhature & Lassi&#10;Biryani & Salan"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                  Publish to Students
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
