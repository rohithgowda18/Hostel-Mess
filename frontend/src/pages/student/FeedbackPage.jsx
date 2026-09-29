import { useState, useEffect } from 'react';
import { messApi } from '@/services/mess-api';
import { getUser } from '@/services/auth-service';
import { usePageTitle } from '@/hooks/use-page-title';
import { useToast } from '@/context/toast-context';
import { EmptyState } from '@/components/ui/empty-state';

export default function FeedbackPage() {
  const currentUser = getUser() || {};
  const toast = useToast();
  usePageTitle('Feedback & Reviews', 'Rate dining hall meal quality, taste, and submit mess feedback.');
  const [activeTab, setActiveTab] = useState('rate'); // 'rate' | 'file' | 'status'

  // Dish ratings state
  const [ratings, setRatings] = useState({});
  const [activeTags, setActiveTags] = useState({});
  const [dishComments, setDishComments] = useState({});
  const [submittedDishes, setSubmittedDishes] = useState({});
  const [dishes, setDishes] = useState([]);
  const [activeSlot, setActiveSlot] = useState('LUNCH');
  const [ratingsSummary, setRatingsSummary] = useState(null);

  // Complaint state
  const [complaintCategory, setComplaintCategory] = useState('');
  const [urgency, setUrgency] = useState('Medium');
  const [description, setDescription] = useState('');
  const [complaintsList, setComplaintsList] = useState([]);
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [complaintSuccess, setComplaintSuccess] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const loadData = async () => {
    try {
      const slotInfo = await messApi.getActiveSlotInfo().catch(() => null);
      const slot = (slotInfo?.isActive && slotInfo.activeSlot) ? slotInfo.activeSlot : 'LUNCH';
      setActiveSlot(slot);

      const dayIndex = new Date().getDay();
      const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const todayKey = dayMap[dayIndex];

      const [weeklyMenu, consensus, summary] = await Promise.all([
        messApi.getWeeklyMenu().catch(() => null),
        messApi.getMealConsensus(slot, todayStr).catch(() => null),
        messApi.getMealRatingsSummary(slot, todayStr).catch(() => null)
      ]);

      if (summary) setRatingsSummary(summary);

      let items = [];
      if (consensus?.items && consensus.items.length > 0) {
        items = consensus.items.map((it) => it.name);
      } else if (consensus?.expectedItems && consensus.expectedItems.length > 0) {
        items = consensus.expectedItems;
      } else if (weeklyMenu && weeklyMenu[todayKey] && weeklyMenu[todayKey][slot]) {
        items = weeklyMenu[todayKey][slot];
      }

      if (items.length > 0) {
        setDishes(
          items.map((name, idx) => ({
            key: `dish_${idx}`,
            name,
            subtitle: `${slot} Service • Campus Scheduled Item`,
            badge: 'Scheduled',
            tags: ['Served Hot 🔥', 'Good Portion 🥣', 'Cooked Just Right 🍚', 'Fresh Quality ✨']
          }))
        );
      } else {
        setDishes([
          {
            key: 'general_meal',
            name: `${slot} Meal Service`,
            subtitle: `Overall ${slot.toLowerCase()} taste & dining experience`,
            badge: 'Session',
            tags: ['Hot & Fresh', 'Good Portion', 'Punctual Refills', 'Clean Dining Floor']
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to load dynamic dishes:', err);
    }
  };

  const loadComplaints = async () => {
    try {
      const slots = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];
      const slotResults = await Promise.all(
        slots.map((s) => messApi.getComplaintsToday(s).catch(() => []))
      );
      const combined = slotResults.flat();
      if (combined.length > 0) {
        setComplaintsList(combined);
      } else {
        const saved = localStorage.getItem('hostel_mess_complaints_v3');
        if (saved) setComplaintsList(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Failed to load complaints:', err);
    }
  };

  useEffect(() => {
    loadData();
    loadComplaints();
  }, []);

  const handleStarClick = (dishKey, star) => {
    setRatings((prev) => ({ ...prev, [dishKey]: star }));
  };

  const toggleTag = (dishKey, tag) => {
    const key = `${dishKey}_${tag}`;
    setActiveTags((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleDishRatingSubmit = async (dishKey, dishName) => {
    try {
      const score = ratings[dishKey] || 5;
      const comment = dishComments[dishKey] || '';
      await messApi.submitMealRating({
        mealType: activeSlot,
        date: todayStr,
        ratingOverall: score,
        reviewText: `${dishName}: ${comment}`,
        taste: score,
        quality: score,
        cleanliness: score
      });
      setSubmittedDishes((prev) => ({ ...prev, [dishKey]: true }));
      toast.success(
        'Rating Submitted',
        `Thank you! Rated ${score}/5 stars for ${dishName}.`
      );
      setTimeout(() => {
        setSubmittedDishes((prev) => ({ ...prev, [dishKey]: false }));
      }, 3000);
    } catch (err) {
      console.error('Failed to submit dish rating:', err);
      toast.error('Rating Error', err.message || 'Could not record rating. Please try again.');
    }
  };

  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || !complaintCategory) return;
    setSubmittingComplaint(true);
    setComplaintSuccess('');

    try {
      const payload = {
        category: complaintCategory,
        mealType: activeSlot,
        foodItem: 'General Service',
        comment: `[Urgency: ${urgency}] ${description.trim()}`,
        reasons: [complaintCategory]
      };

      const res = await messApi.raiseComplaint(payload).catch(() => null);
      const newRecord = {
        id: res?.id || `CMP-${Math.floor(1000 + Math.random() * 9000)}`,
        category: complaintCategory,
        description: description.trim(),
        urgency,
        status: 'OPEN',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };

      const updated = [newRecord, ...complaintsList];
      setComplaintsList(updated);
      localStorage.setItem('hostel_mess_complaints_v3', JSON.stringify(updated));

      setDescription('');
      setComplaintCategory('');
      setComplaintSuccess('Your grievance ticket has been filed with the Hostel Warden.');
      toast.success(
        'Feedback Ticket Logged',
        `Reference #${newRecord.id} generated for ${complaintCategory}.`
      );
      setActiveTab('status');
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      toast.error('Submission Failed', err.message || 'Could not submit grievance. Please try again.');
    } finally {
      setSubmittingComplaint(false);
    };

    return (
      <div className="w-full space-y-6 pb-12">
        {/* Top QA Hero Card */}
        <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-6 shadow-sm border border-outline-variant/20">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
          <div className="absolute right-32 -bottom-20 w-48 h-48 rounded-full bg-secondary/10 blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] uppercase tracking-wider font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Hostel QA Desk
                </span>
                <span className="text-xs text-on-surface-variant">Block C • Mess Hall East</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-on-surface tracking-tight">
                Feedback & Quality Assurance
              </h1>
              <p className="text-xs text-on-surface-variant max-w-2xl leading-relaxed">
                Rate daily dishes, report hygiene or taste issues, and track hostel mess resolution status in real time.
              </p>
            </div>

            {/* Segmented Tab Controls */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-container-low border border-outline-variant/20 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setActiveTab('rate')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'rate'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
              >
                <span className="material-symbols-outlined text-[16px]">restaurant</span>
                <span>Rate Dishes</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('file')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'file'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
              >
                <span className="material-symbols-outlined text-[16px]">report_problem</span>
                <span>File Complaint</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('status')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'status'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
              >
                <span className="material-symbols-outlined text-[16px]">rule</span>
                <span>Submissions</span>
                <span className="px-1.5 py-0.2 rounded-full bg-primary-container text-on-primary text-[10px]">
                  {complaintsList.length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {complaintSuccess && (
          <div className="p-3 rounded-lg bg-secondary-container/40 border border-secondary text-secondary text-xs font-semibold">
            {complaintSuccess}
          </div>
        )}

        {/* Main Grid: Content + QA Stats */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left Column: Active Tab Content (8 cols) */}
          <div className="xl:col-span-8 space-y-5">
            {/* TAB 1: RATE RECENT DISHES */}
            {activeTab === 'rate' && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary-fixed text-primary">
                      <span className="material-symbols-outlined text-[18px]">lunch_dining</span>
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-on-surface">Dish Rating Cards</h2>
                      <p className="text-[11px] text-on-surface-variant">{activeSlot} Service • Campus Meal Session</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-secondary-container/40 text-on-secondary-container text-[11px] font-semibold">
                    Live Feedback Open
                  </span>
                </div>

                {/* Dish Cards List */}
                <div className="space-y-4">
                  {dishes.map((dish) => {
                    const score = ratings[dish.key] || 5;
                    const isSubmitted = submittedDishes[dish.key];

                    return (
                      <div
                        key={dish.key}
                        className="rounded-xl bg-surface-container-lowest p-5 shadow-sm border border-outline-variant/20 transition-all hover:shadow-md"
                      >
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
                            <span className="material-symbols-outlined text-[24px]">restaurant</span>
                          </div>

                          <div className="flex-1 space-y-3 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <div>
                                <h3 className="text-sm font-bold text-on-surface">{dish.name}</h3>
                                <p className="text-[11px] text-on-surface-variant">{dish.subtitle}</p>
                              </div>

                              {/* Interactive Star Rating */}
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => handleStarClick(dish.key, s)}
                                    className="text-outline-variant hover:text-amber-500 transition-colors cursor-pointer"
                                  >
                                    <span
                                      className={`material-symbols-outlined text-[22px] ${score >= s ? 'text-amber-500' : 'text-outline-variant'
                                        }`}
                                    >
                                      star
                                    </span>
                                  </button>
                                ))}
                                <span className="ml-1 text-[11px] font-bold text-on-surface">
                                  {score}/5
                                </span>
                              </div>
                            </div>

                            {/* Quick Tag Chips */}
                            <div className="flex flex-wrap gap-1.5">
                              {dish.tags.map((tag) => {
                                const isTagActive = activeTags[`${dish.key}_${tag}`];
                                return (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => toggleTag(dish.key, tag)}
                                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${isTagActive
                                        ? 'bg-primary text-on-primary'
                                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                                      }`}
                                  >
                                    {tag}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Feedback Input & Submit Button */}
                            <div className="flex flex-col sm:flex-row gap-2 pt-1">
                              <input
                                type="text"
                                value={dishComments[dish.key] || ''}
                                onChange={(e) =>
                                  setDishComments({ ...dishComments, [dish.key]: e.target.value })
                                }
                                placeholder="Optional comments on spice, salt, texture..."
                                className="flex-1 px-3 py-1.5 rounded-lg bg-surface-container-low text-xs text-on-surface placeholder:text-on-surface-variant outline-none border border-outline-variant/30 focus:border-primary"
                              />
                              <button
                                type="button"
                                onClick={() => handleDishRatingSubmit(dish.key, dish.name)}
                                className="px-4 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-all flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  {isSubmitted ? 'check' : 'send'}
                                </span>
                                <span>{isSubmitted ? 'Recorded!' : 'Submit Rating'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* TAB 2: FILE A COMPLAINT */}
            {activeTab === 'file' && (
              <section className="rounded-xl bg-surface-container-lowest p-6 shadow-sm border border-outline-variant/20 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-error-container text-on-error-container">
                    <span className="material-symbols-outlined text-[20px]">assignment_late</span>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-on-surface">Quick Ticket / Complaint Submission Box</h2>
                    <p className="text-[11px] text-on-surface-variant">Direct routing to Hostel Warden and Student Mess Council</p>
                  </div>
                </div>

                <form onSubmit={handleComplaintSubmit} className="space-y-4 pt-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Category */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-on-surface">Issue Category</label>
                      <select
                        required
                        value={complaintCategory}
                        onChange={(e) => setComplaintCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary cursor-pointer"
                      >
                        <option value="" disabled>Select category...</option>
                        <option value="Food Quality">Food Quality (Taste, Raw, Burnt)</option>
                        <option value="Hygiene">Hygiene & Cleanliness (Utensils, Dining Floor)</option>
                        <option value="Delay">Delay / Refill Shortage at Counters</option>
                        <option value="Staff">Staff Courtesy & Service</option>
                        <option value="Suggestion">Menu Suggestion / General Inquiry</option>
                      </select>
                    </div>

                    {/* Urgency Level Radios */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-on-surface">Urgency Level</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'Urgent'].map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setUrgency(lvl)}
                            className={`h-9 rounded-lg text-xs font-semibold transition-all cursor-pointer ${urgency === lvl
                                ? lvl === 'Urgent'
                                  ? 'bg-error-container text-on-error-container'
                                  : 'bg-primary-fixed text-on-primary-fixed'
                                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                              }`}
                          >
                            {lvl === 'Urgent' ? 'Urgent ⚠️' : lvl}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-on-surface">Description & Context</label>
                    <textarea
                      rows={4}
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="State exact meal timing, station counter, or specifics (e.g. cutlery dispenser empty during peak 1:15 PM lunch)..."
                      className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-xs text-on-surface placeholder:text-on-surface-variant outline-none border border-outline-variant/30 focus:border-primary resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
                    <div className="flex items-center gap-1.5 text-on-surface-variant text-[11px]">
                      <span className="material-symbols-outlined text-[16px] text-secondary">verified_user</span>
                      <span>Trackable ticket auto-forwarded to Hostel Head</span>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingComplaint}
                      className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      {submittingComplaint ? 'Filing...' : 'Submit Grievance Ticket'}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {/* TAB 3: SUBMISSIONS & STATUS */}
            {activeTab === 'status' && (
              <section className="rounded-xl bg-surface-container-lowest p-6 shadow-sm border border-outline-variant/20 space-y-4">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                  <h2 className="text-base font-bold text-on-surface">My Grievance Tickets</h2>
                  <span className="text-xs text-on-surface-variant">{complaintsList.length} filed</span>
                </div>

                {complaintsList.length === 0 ? (
                  <EmptyState
                    title="No Grievance Tickets Filed"
                    description="You have not submitted any food quality grievances or dining hall issues."
                    actionLabel="File New Issue"
                    onAction={() => setActiveTab('file')}
                  />
                ) : (
                  <div className="divide-y divide-outline-variant/20">
                    {complaintsList.map((item, idx) => (
                      <div key={item.id || idx} className="py-3.5 space-y-1.5 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-on-surface">{item.category}</span>
                            <span className="text-on-surface-variant text-[11px] ml-2">
                              • {item.date || 'Today'}
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.status === 'RESOLVED'
                              ? 'bg-secondary-container/40 text-secondary'
                              : 'bg-primary-fixed text-primary'
                            }`}>
                            {item.status || 'OPEN'}
                          </span>
                        </div>
                        <p className="text-on-surface-variant leading-relaxed">
                          {item.description || item.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Right Column: Monthly Mess Health & Quality Index (4 cols) */}
          <div className="xl:col-span-4 space-y-5">
            {/* Real Meal Satisfaction Card */}
            <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/20 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-on-surface">Meal Satisfaction Index</h3>
                <span className="text-xs text-secondary font-semibold">
                  {ratingsSummary?.count ? `${ratingsSummary.count} Reviews` : 'Live Metrics'}
                </span>
              </div>

              {ratingsSummary?.count ? (
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-surface-container stroke-current"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        strokeWidth="3.5"
                      />
                      <path
                        className="text-primary stroke-current"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        strokeDasharray={`${Math.round(((ratingsSummary.avgOverall || 4) / 5) * 100)}, 100`}
                        strokeLinecap="round"
                        strokeWidth="3.5"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-sm font-bold text-on-surface">{ratingsSummary.avgOverall || 4.0}</span>
                      <span className="text-[9px] text-on-surface-variant">Out of 5</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 flex-1 text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] mb-0.5">
                        <span className="text-on-surface-variant">Taste</span>
                        <span className="font-bold text-on-surface">{ratingsSummary.taste || ratingsSummary.avgOverall || '—'} / 5</span>
                      </div>
                      <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-secondary h-full rounded-full"
                          style={{ width: `${Math.min(100, ((ratingsSummary.taste || 4) / 5) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-0.5">
                        <span className="text-on-surface-variant">Cleanliness</span>
                        <span className="font-bold text-on-surface">{ratingsSummary.cleanliness || ratingsSummary.avgOverall || '—'} / 5</span>
                      </div>
                      <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full"
                          style={{ width: `${Math.min(100, ((ratingsSummary.cleanliness || 4) / 5) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center space-y-1">
                  <p className="text-xs font-semibold text-on-surface">No reviews for this session yet</p>
                  <p className="text-[11px] text-on-surface-variant">Submit the first rating to generate today's satisfaction score.</p>
                </div>
              )}
            </div>

            {/* SLA Resolution Guarantee */}
            <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/20 space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">verified</span>
                <h3 className="text-xs font-bold text-on-surface">Warden SLA Guarantee</h3>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                All hygiene and food complaints flagged as Urgent are acknowledged within 4 hours by the Mess Secretary and Warden Council.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}