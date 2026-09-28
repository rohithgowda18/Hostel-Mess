import { useState, useEffect } from 'react';
import {
  Star,
  MessageSquare,
  Filter,
  RefreshCw,
  UtensilsCrossed,
  CheckCircle2,
  Calendar,
  User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { messApi } from '@/services/mess-api';

export default function AdminRatingsPage() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState('');

  const fetchRatings = async () => {
    try {
      const data = await messApi.getAdminRatings();
      if (Array.isArray(data)) {
        setRatings(data);
      }
    } catch (err) {
      console.error('Failed to load ratings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRatings();
  };

  // Filter ratings
  const filteredRatings = ratings.filter((r) => {
    const mealMatch = selectedMeal === 'ALL' || (r.mealType || '').toUpperCase() === selectedMeal;
    const dateMatch = !selectedDate || r.date === selectedDate;
    return mealMatch && dateMatch;
  });

  // Calculate metrics
  const totalCount = filteredRatings.length;
  const avgOverall = totalCount > 0
    ? (filteredRatings.reduce((sum, r) => sum + (r.ratingOverall || 0), 0) / totalCount).toFixed(1)
    : '0.0';

  // Meal breakdown
  const mealBreakdown = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'].map((m) => {
    const matching = ratings.filter((r) => (r.mealType || '').toUpperCase() === m);
    const avg = matching.length > 0
      ? (matching.reduce((s, r) => s + (r.ratingOverall || 0), 0) / matching.length).toFixed(1)
      : 'N/A';
    return { meal: m, count: matching.length, avg };
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black text-text tracking-tight">
              Meal Ratings & Quality Feedback
            </h1>
            <Badge variant="primary" className="text-[11px] font-bold">
              {ratings.length} Total Reviews
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Authentic student ratings and qualitative comments submitted through the dining portal.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-xs gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 bg-surface border-border">
          <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Average Rating</p>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-3xl font-black text-text">{avgOverall}</span>
            <span className="text-xs font-semibold text-text-muted">/ 5.0</span>
          </div>
          <div className="flex items-center gap-1 text-amber-500 pt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-3.5 w-3.5 ${
                  star <= Math.round(Number(avgOverall)) ? 'fill-current' : 'text-border'
                }`}
              />
            ))}
          </div>
        </Card>

        {mealBreakdown.slice(0, 3).map((item) => (
          <Card key={item.meal} className="p-4 bg-surface border-border">
            <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
              {item.meal}
            </p>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-2xl font-black text-text">{item.avg}</span>
              <span className="text-xs text-text-muted">avg</span>
            </div>
            <p className="text-[11px] text-text-muted mt-1">{item.count} student ratings</p>
          </Card>
        ))}
      </div>

      {/* Filters (Section 28: Meal, Date) */}
      <Card className="p-4 bg-surface border-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-text-secondary flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" /> Filter by:
          </span>
          {['ALL', 'BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'].map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMeal(m)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedMeal === m
                  ? 'bg-primary text-white'
                  : 'bg-surface-elevated border border-border text-text-secondary hover:text-text'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-text-muted" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg border border-border bg-surface text-text"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="text-xs text-text-muted hover:text-text cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </Card>

      {/* Recent Reviews & Comments (Section 28) */}
      <Card className="bg-surface border-border overflow-hidden">
        <div className="p-4 bg-surface-elevated border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-text flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Resident Meal Reviews ({filteredRatings.length})
          </h3>
          <span className="text-xs text-text-secondary">Sorted by most recent</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-text-muted">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
            Loading meal ratings...
          </div>
        ) : filteredRatings.length === 0 ? (
          <div className="py-16 text-center text-xs text-text-muted">
            No meal ratings recorded matching this filter.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredRatings.map((r, idx) => (
              <div key={r.id || idx} className="p-4 hover:bg-surface-elevated/40 transition-colors space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-text flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-text-muted" />
                      {r.userEmail ? r.userEmail.split('@')[0] : 'Resident Student'}
                    </span>
                    <Badge variant="primary" className="text-[10px]">
                      {r.mealType || 'MEAL'}
                    </Badge>
                    <span className="text-xs text-text-muted">•</span>
                    <span className="text-xs text-text-muted">{r.date}</span>
                  </div>

                  <div className="flex items-center gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-3.5 w-3.5 ${s <= r.ratingOverall ? 'fill-current' : 'text-border'}`}
                      />
                    ))}
                    <span className="ml-1 text-xs font-bold text-text">{r.ratingOverall}/5</span>
                  </div>
                </div>

                {r.reviewText ? (
                  <p className="text-xs text-text-secondary leading-relaxed pl-5 border-l-2 border-primary/30">
                    "{r.reviewText}"
                  </p>
                ) : (
                  <p className="text-xs text-text-muted italic pl-5">
                    No written comment provided.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
