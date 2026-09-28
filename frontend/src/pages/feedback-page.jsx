import { useEffect, useState } from 'react';
import { messApi } from '@/services/mess-api';
import { getUser } from '@/services/auth-service';
import {
  MessageSquareWarning,
  Star,
  AlertTriangle,
  History,
  ShieldCheck,
  CheckCircle2,
  Send,
  Coffee,
  Sun,
  Sunset,
  Moon,
  Filter,
  Clock,
  Sparkles,
  Inbox
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';

const TABS = [
  { id: 'ratings', label: 'Rate Today Meals', icon: Star },
  { id: 'complaints', label: 'File Complaint / Issue', icon: AlertTriangle },
  { id: 'my-feedback', label: 'My Past Reports', icon: History },
  { id: 'admin', label: 'Warden Resolution Desk', icon: ShieldCheck, adminOnly: true },
];

const MEAL_SLOTS = [
  { key: 'BREAKFAST', name: 'Breakfast', icon: Coffee, time: '07:30 – 09:30 AM' },
  { key: 'LUNCH', name: 'Lunch', icon: Sun, time: '12:30 – 02:30 PM' },
  { key: 'SNACKS', name: 'Evening Snacks', icon: Sunset, time: '04:30 – 05:30 PM' },
  { key: 'DINNER', name: 'Dinner', icon: Moon, time: '07:30 – 09:30 PM' },
];

const COMPLAINT_CATEGORIES = [
  'Food Taste & Quality',
  'Hygiene & Cleanliness',
  'Cold Food / Temperature',
  'Inadequate Portion',
  'Shortage / Item Unavailable',
  'Staff Conduct'
];

function InteractiveStarRating({ value = 0, onChange }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = (hover || value) >= star;
        return (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(star)}
            className="p-1 transition-transform active:scale-90"
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                isFilled
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-slate-300 dark:text-slate-700'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

export default function FeedbackPage() {
  const currentUser = getUser() || {};
  const isAdmin = currentUser.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState('ratings');
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});
  const [todayMeals, setTodayMeals] = useState([]);
  const [complaintForm, setComplaintForm] = useState({ category: 'Food Taste & Quality', meal: 'LUNCH', description: '' });
  const [myFeedback, setMyFeedback] = useState([]);
  const [adminComplaints, setAdminComplaints] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [feedbackStatusMsg, setFeedbackStatusMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const loadFeedbackData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const mealMap = await messApi.getAllTodayMeals(MEAL_SLOTS.map((s) => s.key)).catch(() => ({}));
      const loadedMeals = MEAL_SLOTS.map((slot) => ({
        ...slot,
        items: mealMap[slot.key]?.items || [],
      }));
      setTodayMeals(loadedMeals);

      const [todayComplaints, reports] = await Promise.all([
        messApi.getComplaintsToday('LUNCH').catch(() => []),
        messApi.getMyReports().catch(() => [])
      ]);

      if (Array.isArray(todayComplaints)) {
        setAdminComplaints(todayComplaints);
        if (todayComplaints.length > 0) setSelectedAdmin(todayComplaints[0]);
      }
      setMyFeedback(Array.isArray(reports) ? reports : []);
    } catch (e) {
      console.error('Error loading complaints/feedback:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedbackData();
  }, []);

  const handleSubmitRating = async (mealSlot) => {
    const star = ratings[mealSlot];
    if (!star) return;
    try {
      const date = new Date().toISOString().split('T')[0];
      await messApi.submitMealRating({ mealType: mealSlot, date, rating: star, comment: comments[mealSlot] || '' });
      setFeedbackStatusMsg(`Rating for ${mealSlot} submitted successfully!`);
      setTimeout(() => setFeedbackStatusMsg(''), 3000);
    } catch (e) {
      setFeedbackStatusMsg('Failed to submit rating to server.');
    }
  };

  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    if (!complaintForm.description.trim()) return;
    try {
      await messApi.raiseComplaint({
        foodItem: complaintForm.category,
        mealType: complaintForm.meal,
        date: new Date().toISOString().split('T')[0],
        issueType: complaintForm.category,
        comment: complaintForm.description
      });
      setFeedbackStatusMsg('Complaint submitted directly to hostel warden desk.');
      setComplaintForm({ category: 'Food Taste & Quality', meal: 'LUNCH', description: '' });
      loadFeedbackData();
      setTimeout(() => setFeedbackStatusMsg(''), 4000);
    } catch (e) {
      setFeedbackStatusMsg('Error submitting complaint.');
    }
  };

  return (
    <div className="space-y-6 pb-6">
      <PageHeader
        badge={
          <Badge variant="primary" className="text-[10px] font-bold">
            Quality Assurance
          </Badge>
        }
        title="Mess Feedback & Complaints"
        description="Submit meal ratings to dining services, report hygiene or preparation issues, and track official resolution."
      />

      {/* Success Notification Alert */}
      {feedbackStatusMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{feedbackStatusMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200/80 dark:border-slate-700/80 w-fit overflow-x-auto no-scrollbar">
        {TABS.filter((t) => !t.adminOnly || isAdmin).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-900 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Rate Today's Meals */}
      {activeTab === 'ratings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {todayMeals.map((slot) => {
            const Icon = slot.icon;
            const currentRating = ratings[slot.key] || 0;

            return (
              <Card key={slot.key} className="p-6 shadow-card space-y-4">
                <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/40">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {slot.name} Service
                      </h3>
                      <p className="text-xs text-slate-400 font-mono">{slot.time}</p>
                    </div>
                  </div>
                  {slot.items.length > 0 && (
                    <Badge variant="neutral" className="text-[10px]">
                      {slot.items.length} Dishes
                    </Badge>
                  )}
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Served Today: </span>
                  {slot.items.length > 0 ? slot.items.join(', ') : 'Standard kitchen menu'}
                </div>

                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    How was the food quality?
                  </label>
                  <InteractiveStarRating
                    value={currentRating}
                    onChange={(star) => setRatings({ ...ratings, [slot.key]: star })}
                  />

                  <Input
                    placeholder="Add brief comments (e.g. sambar was great, chapati was dry)..."
                    value={comments[slot.key] || ''}
                    onChange={(e) => setComments({ ...comments, [slot.key]: e.target.value })}
                    className="text-xs h-10"
                  />

                  <Button
                    size="sm"
                    disabled={!currentRating}
                    onClick={() => handleSubmitRating(slot.key)}
                    className="w-full text-xs font-bold bg-blue-600 hover:bg-blue-700"
                  >
                    Submit {slot.name} Rating
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tab 2: File a Complaint */}
      {activeTab === 'complaints' && (
        <Card className="max-w-2xl p-6 sm:p-8 shadow-card">
          <form onSubmit={handleComplaintSubmit} className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Lodge an Official Mess Complaint
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Your report will be forwarded to the chief hostel warden and kitchen catering supervisor.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                1. Issue Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COMPLAINT_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setComplaintForm({ ...complaintForm, category: cat })}
                    className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                      complaintForm.category === cat
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 text-blue-700 dark:text-blue-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                2. Affected Meal Service
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {MEAL_SLOTS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setComplaintForm({ ...complaintForm, meal: s.key })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      complaintForm.meal === s.key
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                3. Detailed Description
              </label>
              <textarea
                required
                rows={4}
                value={complaintForm.description}
                onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                placeholder="Explain the issue clearly (e.g. food was served cold, missing side items, contaminated counter)..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
            >
              <Send className="h-4 w-4" /> Submit Official Complaint
            </Button>
          </form>
        </Card>
      )}

      {/* Tab 3: My Past Reports History */}
      {activeTab === 'my-feedback' && (
        myFeedback.length === 0 ? (
          <EmptyState
            icon={History}
            title="No past reports found"
            description="You haven't submitted any complaints or quality reviews yet."
            actionLabel="File an Issue"
            onAction={() => setActiveTab('complaints')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myFeedback.map((report, idx) => (
              <Card key={report.id || idx} className="p-5 shadow-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {report.foodItem || report.issueType || 'Mess Report'}
                  </span>
                  <Badge variant={report.status === 'RESOLVED' ? 'success' : 'warning'}>
                    {report.status || 'PENDING'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {report.comment || report.description}
                </p>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Meal: {report.mealType || 'Lunch'}</span>
                  <span>Date: {report.date || 'Today'}</span>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Tab 4: Warden Resolution Desk (Admin Only) */}
      {activeTab === 'admin' && isAdmin && (
        <Card className="p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Warden Complaint Desk
              </h3>
              <p className="text-xs text-slate-500">Live student reports for today's meals</p>
            </div>
            <Badge variant="primary">{adminComplaints.length} Total Issues</Badge>
          </div>

          {adminComplaints.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No unresolved complaints filed for today's service window.
            </div>
          ) : (
            <div className="space-y-3">
              {adminComplaints.map((comp) => (
                <div
                  key={comp.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-900 dark:text-slate-100">{comp.foodItem}</span>
                    <Badge variant={comp.status === 'RESOLVED' ? 'success' : 'warning'}>
                      {comp.status || 'PENDING'}
                    </Badge>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">{comp.comment}</p>
                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                    <span>Filed by: {comp.userEmail || 'Resident'}</span>
                    <span>Meal: {comp.mealType}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
