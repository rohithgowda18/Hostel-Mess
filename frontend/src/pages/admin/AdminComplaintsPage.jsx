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
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Student Grievances & Complaints Desk
            </h1>
            <Badge variant="primary" className="text-[11px] font-bold">
              {complaints.length} Total Tickets
            </Badge>
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
          Refresh Tickets
        </Button>
      </div>

      {/* Success banner */}
      {successMsg && (
        <div className="p-3 rounded-md bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/40 text-green-800 dark:text-green-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 3 Status KPI Cards (Section 29) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card
          onClick={() => setStatusFilter('OPEN')}
          className={`p-4 bg-surface border cursor-pointer transition-colors ${
            statusFilter === 'OPEN' ? 'border-danger ring-1 ring-danger/40' : 'border-border'
          }`}
        >
          <p className="text-[11px] font-bold text-danger uppercase tracking-wider">Open Tickets</p>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-2xl font-bold text-danger">{openCount}</span>
            <span className="text-xs text-text-muted">pending triage</span>
          </div>
        </Card>

        <Card
          onClick={() => setStatusFilter('IN_PROGRESS')}
          className={`p-4 bg-surface border cursor-pointer transition-colors ${
            statusFilter === 'IN_PROGRESS' ? 'border-amber-500 ring-1 ring-amber-500/40' : 'border-border'
          }`}
        >
          <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">In Progress</p>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{inProgressCount}</span>
            <span className="text-xs text-text-muted">under investigation</span>
          </div>
        </Card>

        <Card
          onClick={() => setStatusFilter('RESOLVED')}
          className={`p-4 bg-surface border cursor-pointer transition-colors ${
            statusFilter === 'RESOLVED' ? 'border-emerald-600 ring-1 ring-emerald-600/40' : 'border-border'
          }`}
        >
          <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Resolved</p>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{resolvedCount}</span>
            <span className="text-xs text-text-muted">closed tickets</span>
          </div>
        </Card>
      </div>

      {/* Filter Row */}
      <Card className="p-4 bg-surface border-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-text-secondary flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" /> Status:
          </span>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === s
                  ? 'bg-teal-700 text-white dark:bg-teal-500 dark:text-slate-950 font-bold'
                  : 'bg-surface-elevated border border-border text-text-secondary hover:text-text'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-text-secondary">Meal:</span>
          {MEAL_FILTERS.map((m) => (
            <button
              key={m}
              onClick={() => setMealFilter(m)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mealFilter === m
                  ? 'bg-primary text-white'
                  : 'bg-surface-elevated border border-border text-text-secondary hover:text-text'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </Card>

      {/* Complaints List (Section 29) */}
      <Card className="bg-surface border-border overflow-hidden">
        <div className="p-4 bg-surface-elevated border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-text">Resident Grievance Feed ({filtered.length})</h3>
          <span className="text-xs text-text-secondary">Click any ticket to inspect & update status</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-text-muted">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
            Loading complaint logs...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-text-muted">
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
                  className="p-4 hover:bg-surface-elevated/50 transition-colors cursor-pointer space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={isResolved ? 'success' : isInProgress ? 'warning' : 'danger'}
                        className="text-[10px] font-bold"
                      >
                        {c.status || 'OPEN'}
                      </Badge>
                      <span className="text-xs font-bold text-text">
                        {c.category || 'General Dining'}
                      </span>
                      <span className="text-xs text-text-muted">•</span>
                      <span className="text-xs text-text-secondary">
                        {c.mealType || 'Meal'} • {c.foodItem || 'Dining Hall'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-text-muted">
                      <Clock className="h-3 w-3" />
                      <span>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : c.date || 'Today'}</span>
                    </div>
                  </div>

                  <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                    {c.description || c.comment}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-text-muted">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {c.studentEmail || c.userEmail || 'Resident Student'}
                    </span>
                    <span className="text-primary font-semibold flex items-center gap-0.5">
                      View Ticket <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

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
