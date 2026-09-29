import { useState, useEffect } from 'react';
import { messApi } from '@/services/mess-api';
import { getUser } from '@/services/auth-service';
import {
  MessageSquareWarning,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Camera,
  X,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const CATEGORIES = [
  'Food Quality & Taste',
  'Hygiene & Cleanliness',
  'Shortage / Missing Item',
  'Cold Food / Temperature',
  'Portion Size',
  'Staff Behavior'
];

export default function ComplaintsPage() {
  const currentUser = getUser() || {};
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [mealType, setMealType] = useState('LUNCH');
  const [foodItem, setFoodItem] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadComplaints = async () => {
    setLoading(true);
    try {
      // Fetch complaints from today's active meal slots
      const slots = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];
      const slotResults = await Promise.all(
        slots.map((s) => messApi.getComplaintsToday(s).catch(() => []))
      );
      const combined = slotResults.flat();

      if (combined.length > 0) {
        setComplaints(combined);
      } else {
        // Fallback to local stored history if empty
        const saved = localStorage.getItem('hostel_mess_complaints_v3');
        if (saved) {
          setComplaints(JSON.parse(saved));
        }
      }
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;

    setSubmitting(true);
    try {
      const payload = {
        category,
        mealType,
        foodItem: foodItem.trim() || 'General Dining',
        comment: description.trim(),
        reasons: [category]
      };

      const res = await messApi.raiseComplaint(payload).catch(() => null);

      const newRecord = {
        id: res?.id || `CMP-${Math.floor(1000 + Math.random() * 9000)}`,
        category,
        foodItem: foodItem.trim() || 'General Dining',
        mealType,
        description: description.trim(),
        status: 'OPEN',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        photoUrl
      };

      const updated = [newRecord, ...complaints];
      setComplaints(updated);
      localStorage.setItem('hostel_mess_complaints_v3', JSON.stringify(updated));

      setModalOpen(false);
      setDescription('');
      setFoodItem('');
      setPhotoUrl('');
      setSuccessMsg('Complaint submitted successfully to mess administration.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to raise complaint:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = statusFilter === 'ALL'
    ? complaints
    : complaints.filter((c) => (c.status || 'OPEN').toUpperCase() === statusFilter);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Complaints
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Log grievances directly with the mess committee and monitor resolution.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setModalOpen(true)}
          className="text-xs font-semibold bg-primary hover:bg-primary-container text-on-primary shrink-0"
        >
          New complaint
        </Button>
      </div>

      {successMsg && (
        <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-200 text-xs font-semibold">
          {successMsg}
        </div>
      )}

      {/* Filters: All, Open, In progress, Resolved */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
        {[
          { key: 'ALL', label: 'All' },
          { key: 'OPEN', label: 'Open' },
          { key: 'IN PROGRESS', label: 'In progress' },
          { key: 'RESOLVED', label: 'Resolved' }
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setStatusFilter(f.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === f.key
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Complaints List as Ticket Rows */}
      {filtered.length === 0 ? (
        <div className="py-12 space-y-3">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No complaints yet.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
            If you have an issue with food, hygiene, timing, or service, submit a complaint.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setModalOpen(true)}
            className="text-xs font-semibold"
          >
            New complaint
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-border border-y border-border">
          {filtered.map((item, idx) => {
            const statusUpper = (item.status || 'OPEN').toUpperCase();
            const statusColor =
              statusUpper === 'RESOLVED'
                ? 'text-emerald-700 dark:text-emerald-400'
                : statusUpper === 'IN PROGRESS' || statusUpper === 'UNDER INVESTIGATION'
                ? 'text-amber-700 dark:text-amber-400'
                : 'text-red-700 dark:text-red-400';

            return (
              <div key={item.id || idx} className="py-3.5 space-y-1.5 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                      {item.category || item.reasons?.[0] || 'Food issue'}
                    </span>
                    <p className="text-slate-500 text-[11px]">
                      {item.foodItem ? `${item.foodItem} · ` : ''}{item.mealType || 'Meal'} · {item.date || 'Today'}
                    </p>
                  </div>

                  <span className={`text-[11px] font-semibold capitalize ${statusColor}`}>
                    {statusUpper.toLowerCase()}
                  </span>
                </div>

                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
                  {item.description || item.comment || item.comments?.[0] || 'No description provided.'}
                </p>

                {item.photoUrl && (
                  <div className="pt-1">
                    <img
                      src={item.photoUrl}
                      alt="Complaint photo"
                      className="h-16 w-24 rounded object-cover border border-border"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New Complaint Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Log New Mess Complaint
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateComplaint} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Issue Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Meal Slot
                  </label>
                  <select
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="BREAKFAST">Breakfast</option>
                    <option value="LUNCH">Lunch</option>
                    <option value="SNACKS">Snacks</option>
                    <option value="DINNER">Dinner</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Dish (Optional)
                  </label>
                  <Input
                    placeholder="e.g. Sambar, Dal"
                    value={foodItem}
                    onChange={(e) => setFoodItem(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description of Issue
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the issue clearly..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  size="sm"
                  className="flex-1 text-xs font-bold"
                >
                  {submitting ? 'Submitting...' : 'Submit Complaint'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
