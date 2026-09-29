import { useState, useEffect } from 'react';
import {
  MessageSquareWarning,
  Filter,
  CheckCircle2,
  Clock,
  RefreshCw,
  User,
  AlertTriangle,
  X,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { messApi } from '@/services/mess-api';

const STATUS_FILTERS = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'];
const MEAL_FILTERS = ['ALL', 'BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [mealFilter, setMealFilter] = useState('ALL');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchComplaints = async () => {
    try {
      const data = await messApi.getComplaints().catch(() => []);
      if (Array.isArray(data)) {
        setComplaints(data);
      }
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchComplaints();
  };

  const handleUpdateStatus = async (complaintId, newStatus) => {
    setActionLoading(true);
    try {
      await messApi.updateComplaintStatus(complaintId, newStatus);
      setComplaints((prev) =>
        prev.map((c) =>
          (c.id || c._id) === complaintId ? { ...c, status: newStatus } : c
        )
      );
      if (selectedComplaint && (selectedComplaint.id || selectedComplaint._id) === complaintId) {
        setSelectedComplaint((prev) => ({ ...prev, status: newStatus }));
      }
      setSuccessMsg(`Complaint status updated to ${newStatus}.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to update complaint status:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = complaints.filter((c) => {
    const statusMatch = statusFilter === 'ALL' || (c.status || 'OPEN').toUpperCase() === statusFilter;
    const mealMatch = mealFilter === 'ALL' || (c.mealType || '').toUpperCase() === mealFilter;
    return statusMatch && mealMatch;
  });

  const openCount = complaints.filter((c) => (c.status || 'OPEN') === 'OPEN').length;
  const inProgressCount = complaints.filter((c) => c.status === 'IN_PROGRESS').length;
  const resolvedCount = complaints.filter((c) => c.status === 'RESOLVED').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Student complaints
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {complaints.length} tickets
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Review, investigate, and resolve dining complaints submitted by hostel residents.
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

      {/* Success banner */}
      {successMsg && (
        <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Compact Status Counter Bar */}
      <div className="grid grid-cols-3 divide-x divide-border border border-border rounded-md bg-white dark:bg-slate-900 py-3">
        <button
          onClick={() => setStatusFilter('OPEN')}
          className={`px-4 py-1 text-left transition-colors cursor-pointer ${
            statusFilter === 'OPEN' ? 'bg-rose-50/50 dark:bg-rose-950/20' : ''
          }`}
        >
          <span className="text-xs text-rose-700 dark:text-rose-400 block font-medium">Open</span>
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100 block mt-0.5">{openCount}</span>
          <span className="text-[11px] text-slate-400">Pending triage</span>
        </button>

        <button
          onClick={() => setStatusFilter('IN_PROGRESS')}
          className={`px-4 py-1 text-left transition-colors cursor-pointer ${
            statusFilter === 'IN_PROGRESS' ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''
          }`}
        >
          <span className="text-xs text-amber-700 dark:text-amber-400 block font-medium">In progress</span>
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100 block mt-0.5">{inProgressCount}</span>
          <span className="text-[11px] text-slate-400">Under review</span>
        </button>

        <button
          onClick={() => setStatusFilter('RESOLVED')}
          className={`px-4 py-1 text-left transition-colors cursor-pointer ${
            statusFilter === 'RESOLVED' ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''
          }`}
        >
          <span className="text-xs text-emerald-700 dark:text-emerald-400 block font-medium">Resolved</span>
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100 block mt-0.5">{resolvedCount}</span>
          <span className="text-[11px] text-slate-400">Closed tickets</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-border">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-500 mr-1">Status:</span>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                statusFilter === s
                  ? 'bg-teal-800 text-white dark:bg-teal-700 font-semibold'
                  : 'bg-white dark:bg-slate-900 border border-border text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {s.charAt(0) + s.slice(1).toLowerCase().replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-500 mr-1">Meal:</span>
          {MEAL_FILTERS.map((m) => (
            <button
              key={m}
              onClick={() => setMealFilter(m)}
              className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                mealFilter === m
                  ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-semibold'
                  : 'bg-white dark:bg-slate-900 border border-border text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {m.charAt(0) + m.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Complaints List */}
      <div className="rounded-md border border-border bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Complaints feed ({filtered.length})
          </h3>
          <span className="text-xs text-slate-400">Click any ticket to inspect or update status</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-teal-800 dark:text-teal-400" />
            Loading complaint logs...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No complaints found matching this filter criteria.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((c) => {
              const cid = c.id || c._id;
              const isResolved = c.status === 'RESOLVED';
              const isInProgress = c.status === 'IN_PROGRESS';

              return (
                <div
                  key={cid}
                  onClick={() => setSelectedComplaint(c)}
                  className="p-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        isResolved
                          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : isInProgress
                          ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                          : 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                      }`}>
                        {c.status || 'OPEN'}
                      </span>
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {c.category || 'General Dining'}
                      </span>
                      <span className="text-xs text-slate-300 dark:text-slate-700">•</span>
                      <span className="text-xs text-slate-500">
                        {c.mealType || 'Meal'} • {c.foodItem || 'Dining Hall'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock className="h-3 w-3" />
                      <span>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : c.date || 'Today'}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                    {c.description || c.comment}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {c.studentEmail || c.userEmail || 'Resident Student'}
                    </span>
                    <span className="text-teal-800 dark:text-teal-400 font-semibold flex items-center gap-0.5">
                      View ticket <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Complaint Detail & Action Modal (Section 29) */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-surface rounded-lg p-5 border border-border shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-text">
                    Complaint Investigation
                  </h3>
                  <Badge
                    variant={
                      selectedComplaint.status === 'RESOLVED'
                        ? 'success'
                        : selectedComplaint.status === 'IN_PROGRESS'
                        ? 'warning'
                        : 'danger'
                    }
                    className="text-[10px]"
                  >
                    {selectedComplaint.status || 'OPEN'}
                  </Badge>
                </div>
                <p className="text-xs text-text-secondary">
                  Ticket #{selectedComplaint.id || selectedComplaint._id}
                </p>
              </div>

              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-1.5 rounded-md text-text-muted hover:text-text cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-md bg-surface-elevated border border-border">
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Category</span>
                  <span className="font-semibold text-text">{selectedComplaint.category || 'General'}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Meal Slot</span>
                  <span className="font-semibold text-text">{selectedComplaint.mealType || 'General'}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Dish Mentioned</span>
                  <span className="font-semibold text-text">{selectedComplaint.foodItem || 'General'}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Reporting Student</span>
                  <span className="font-mono text-text truncate block">{selectedComplaint.studentEmail || selectedComplaint.userEmail || 'Resident'}</span>
                </div>
              </div>

              <div>
                <span className="text-text-secondary font-bold block mb-1">Grievance Description:</span>
                <p className="p-3 rounded-xl bg-surface-elevated border border-border text-text leading-relaxed">
                  "{selectedComplaint.description || selectedComplaint.comment}"
                </p>
              </div>

              {selectedComplaint.photoUrl && (
                <div>
                  <span className="text-text-secondary font-bold block mb-1">Photo Evidence:</span>
                  <img
                    src={selectedComplaint.photoUrl}
                    alt="Complaint Evidence"
                    className="max-h-48 rounded-xl object-contain border border-border"
                  />
                </div>
              )}
            </div>

            {/* Admin Actions (Section 29: Mark In Progress, Resolve) */}
            <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-text-secondary">Update Status:</span>

              <div className="flex items-center gap-2">
                {selectedComplaint.status !== 'IN_PROGRESS' && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus(selectedComplaint.id || selectedComplaint._id, 'IN_PROGRESS')}
                    className="text-xs border-amber-500/40 text-amber-500 hover:bg-amber-500/10"
                  >
                    Mark In Progress
                  </Button>
                )}

                {selectedComplaint.status !== 'RESOLVED' && (
                  <Button
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus(selectedComplaint.id || selectedComplaint._id, 'RESOLVED')}
                    className="text-xs bg-success hover:bg-success/90 text-white font-bold"
                  >
                    Resolve Complaint
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedComplaint(null)}
                  className="text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
