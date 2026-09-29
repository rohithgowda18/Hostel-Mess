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

      {/* Operations Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border border border-border rounded-md bg-white dark:bg-slate-900 py-3">
        <div className="px-5 py-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 block">Registered diners</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{analytics?.totalStudents || 0}</span>
            <span className="text-xs text-slate-400">students</span>
          </div>
          <span className="text-[11px] text-slate-400">Active residents</span>
        </div>

        <div className="px-5 py-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 block">Turnout rate</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{attendanceRate}%</span>
            <span className="text-xs text-slate-400">today</span>
          </div>
          <span className="text-[11px] text-slate-400">{checkedIn} / {expected} checked in</span>
        </div>

        <div className="px-5 py-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 block">Average rating</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{analytics?.averageOverallRating || '0.0'}</span>
            <span className="text-xs text-slate-400">/ 5.0</span>
          </div>
          <span className="text-[11px] text-slate-400">{analytics?.totalRatings || 0} reviews</span>
        </div>

        <div className="px-5 py-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 block">Open complaints</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg font-bold text-rose-700 dark:text-rose-400">{analytics?.openComplaints || 0}</span>
            <span className="text-xs text-slate-400">open</span>
          </div>
          <span className="text-[11px] text-slate-400">{analytics?.totalComplaints || 0} total tickets</span>
        </div>
      </div>

      {/* Grid: Ratings & Complaints */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ratings By Meal Type */}
        <div className="rounded-md border border-border bg-white dark:bg-slate-900 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              Meal ratings breakdown
            </h3>
            <span className="text-xs text-slate-500">{analytics?.totalRatings || 0} reviews</span>
          </div>

          {Object.keys(ratingsByMeal).length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
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
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {meal.charAt(0) + meal.slice(1).toLowerCase()}
                      </span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{score} / 5.0</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
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
        </div>

        {/* Complaints Breakdown */}
        <div className="rounded-md border border-border bg-white dark:bg-slate-900 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <MessageSquareWarning className="h-4 w-4 text-rose-600" />
              Complaint resolution status
            </h3>
            <span className="text-xs text-slate-500">{analytics?.totalComplaints || 0} total</span>
          </div>

          {Object.keys(complaintsByStatus).length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
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
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ')}
                      </span>
                      <span className="text-slate-500">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isResolved ? 'bg-emerald-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Grid: Resident Distribution & Attendance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hostel Distribution */}
        <div className="rounded-md border border-border bg-white dark:bg-slate-900 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building className="h-4 w-4 text-teal-800 dark:text-teal-400" />
              Residents by hostel block
            </h3>
          </div>

          {Object.keys(hostelDist).length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No hostel block assignments found.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(hostelDist).map(([hostel, count]) => (
                <div key={hostel} className="p-3 rounded-md bg-slate-50 dark:bg-slate-800/50 border border-border">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block truncate">
                    {hostel}
                  </span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5 block">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Branch / Department Distribution */}
        <div className="rounded-md border border-border bg-white dark:bg-slate-900 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="h-4 w-4 text-teal-800 dark:text-teal-400" />
              Academic branch breakdown
            </h3>
          </div>

          {Object.keys(branchDist).length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No branch information registered.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(branchDist).map(([branch, count]) => (
                <div key={branch} className="p-3 rounded-md bg-slate-50 dark:bg-slate-800/50 border border-border">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block truncate">
                    {branch}
                  </span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5 block">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
