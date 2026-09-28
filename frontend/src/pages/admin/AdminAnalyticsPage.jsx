import { useEffect, useState } from 'react';
import {
  TrendingUp,
  Users,
  UtensilsCrossed,
  MessageSquareWarning,
  Star,
  RefreshCw,
  CheckCircle2,
  Calendar,
  Building
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { messApi } from '@/services/mess-api';

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      const data = await messApi.getDashboardAnalytics();
      setAnalytics(data);
    } catch (e) {
      console.error('Failed to load operational analytics:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-text-muted space-y-2">
        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary" />
        <p>Loading university mess analytics...</p>
      </div>
    );
  }

  const ratingsByMeal = analytics?.ratingsByMealType || {};
  const complaintsByStatus = analytics?.complaintsByStatus || {};
  const complaintsByMeal = analytics?.complaintsByMeal || {};
  const branchDist = analytics?.branchDistribution || {};
  const hostelDist = analytics?.hostelDistribution || {};

  const expected = analytics?.expectedToday || 0;
  const checkedIn = analytics?.checkedIn || 0;
  const attendanceRate = expected > 0 ? Math.round((checkedIn / expected) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Operational Dining Analytics
            </h1>
            <Badge variant="primary" className="text-[11px] font-bold">
              Actual System Telemetry
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Real-time reporting metrics, dining attendance rates, rating distributions, and student complaint trends.
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
          Refresh Metrics
        </Button>
      </div>

      {/* Top 4 Real KPIs (Section 30) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 bg-surface border-border">
          <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Registered Diners</p>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{analytics?.totalStudents || 0}</span>
            <span className="text-xs text-text-muted">students</span>
          </div>
          <p className="text-[11px] text-text-muted mt-1">Total active hostel residents</p>
        </Card>

        <Card className="p-4 bg-surface border-border">
          <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Attendance Rate</p>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{attendanceRate}%</span>
            <span className="text-xs text-text-muted">today</span>
          </div>
          <p className="text-[11px] text-text-muted mt-1">{checkedIn} / {expected} checked in</p>
        </Card>

        <Card className="p-4 bg-surface border-border">
          <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Average Rating</p>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{analytics?.averageOverallRating || '0.0'}</span>
            <span className="text-xs text-text-muted">/ 5.0</span>
          </div>
          <p className="text-[11px] text-text-muted mt-1">{analytics?.totalRatings || 0} reviews logged</p>
        </Card>

        <Card className="p-4 bg-surface border-border">
          <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Grievances</p>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-2xl font-bold text-danger">{analytics?.openComplaints || 0}</span>
            <span className="text-xs text-text-muted">open</span>
          </div>
          <p className="text-[11px] text-text-muted mt-1">{analytics?.totalComplaints || 0} total tickets</p>
        </Card>
      </div>

      {/* Grid: Ratings & Complaints (Section 30) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ratings By Meal Type */}
        <Card className="p-5 bg-surface border-border space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-text flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              Meal Ratings Breakdown
            </h3>
            <span className="text-xs text-text-secondary">{analytics?.totalRatings || 0} Reviews</span>
          </div>

          {Object.keys(ratingsByMeal).length === 0 ? (
            <div className="py-10 text-center text-xs text-text-muted">
              No meal ratings recorded in the database yet.
            </div>
          ) : (
            <div className="space-y-3">
              {['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'].map((meal) => {
                const score = ratingsByMeal[meal] ? Number(ratingsByMeal[meal]).toFixed(1) : 'N/A';
                const pct = ratingsByMeal[meal] ? (Number(ratingsByMeal[meal]) / 5) * 100 : 0;

                return (
                  <div key={meal} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-text">{meal}</span>
                      <span className="font-bold text-text">{score} / 5.0</span>
                    </div>
                    <div className="w-full bg-surface-elevated border border-border h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-teal-700 dark:bg-teal-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Complaints Breakdown */}
        <Card className="p-5 bg-surface border-border space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-text flex items-center gap-2">
              <MessageSquareWarning className="h-4 w-4 text-danger" />
              Complaint Resolution Status
            </h3>
            <span className="text-xs text-text-secondary">{analytics?.totalComplaints || 0} Total</span>
          </div>

          {Object.keys(complaintsByStatus).length === 0 ? (
            <div className="py-10 text-center text-xs text-text-muted">
              No complaints filed yet.
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(complaintsByStatus).map(([status, count]) => {
                const total = analytics?.totalComplaints || 1;
                const pct = Math.round((Number(count) / total) * 100);
                const isResolved = status === 'RESOLVED';

                return (
                  <div key={status} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-text">{status}</span>
                      <span className="font-semibold text-text-secondary">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-surface-elevated border border-border h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isResolved ? 'bg-success' : 'bg-warning'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Grid: Resident Distribution & Attendance (Section 30) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hostel Distribution */}
        <Card className="p-5 bg-surface border-border space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-text flex items-center gap-2">
              <Building className="h-4 w-4 text-primary" />
              Residents by Hostel Block
            </h3>
          </div>

          {Object.keys(hostelDist).length === 0 ? (
            <div className="py-10 text-center text-xs text-text-muted">
              No hostel block assignments found.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(hostelDist).map(([hostel, count]) => (
                <div key={hostel} className="p-3 rounded-md bg-surface-elevated border border-border">
                  <span className="text-[10px] uppercase font-bold text-text-muted block truncate">
                    {hostel}
                  </span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5 block">{count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Branch / Department Distribution */}
        <Card className="p-5 bg-surface border-border space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-text flex items-center gap-2">
              <Users className="h-4 w-4 text-teal-700 dark:text-teal-400" />
              Academic Branch Breakdown
            </h3>
          </div>

          {Object.keys(branchDist).length === 0 ? (
            <div className="py-10 text-center text-xs text-text-muted">
              No branch information registered.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(branchDist).map(([branch, count]) => (
                <div key={branch} className="p-3 rounded-md bg-surface-elevated border border-border">
                  <span className="text-[10px] uppercase font-bold text-text-muted block truncate">
                    {branch}
                  </span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5 block">{count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
