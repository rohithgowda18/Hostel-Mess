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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Mess Complaints
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Log grievances directly with the mess committee and monitor resolution progress.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setModalOpen(true)}
          className="text-xs font-bold gap-1.5 shrink-0"
        >
          <Plus className="h-4 w-4" />
          New Complaint
        </Button>
      </div>

      {successMsg && (
        <div className="p-3 rounded-md bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/40 text-green-800 dark:text-green-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {['ALL', 'OPEN', 'IN PROGRESS', 'RESOLVED'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              statusFilter === st
                ? 'bg-teal-700 text-white dark:bg-teal-500 dark:text-slate-950 font-bold'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Complaints List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 p-8">
          <MessageSquareWarning className="h-8 w-8 text-slate-400 mx-auto" />
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No complaints found.
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            If you encounter issues with food hygiene, quality, or portion sizing, submit a ticket for administration review.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setModalOpen(true)}
            className="text-xs font-bold text-teal-700 dark:text-teal-400"
          >
            Log Complaint
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item, idx) => {
            const statusUpper = (item.status || 'OPEN').toUpperCase();
            const badgeVariant =
              statusUpper === 'RESOLVED'
                ? 'verified'
                : statusUpper === 'IN PROGRESS' || statusUpper === 'UNDER INVESTIGATION'
                ? 'pending'
                : 'danger';

            return (
              <Card key={item.id || idx} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                      {item.category || item.reasons?.[0] || 'Food Issue'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {item.foodItem ? `${item.foodItem} • ` : ''}{item.mealType || 'Meal'} • {item.date || 'Today'}
                    </span>
                  </div>
                  <Badge variant={badgeVariant} className="text-[10px] font-bold">
                    {item.status || 'OPEN'}
                  </Badge>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300">
                  {item.description || item.comment || item.comments?.[0] || 'No description provided.'}
                </p>

                {item.photoUrl && (
                  <div className="pt-1">
                    <img
                      src={item.photoUrl}
                      alt="Complaint proof"
                      className="h-20 w-28 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                )}
              </Card>
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
