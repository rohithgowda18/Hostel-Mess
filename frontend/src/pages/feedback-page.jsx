import { useEffect, useState } from 'react';
import { messApi } from '@/services/mess-api';
import { getUser } from '@/services/auth-service';

const TABS = [
  { id: 'ratings', label: 'Ratings', icon: 'star' },
  { id: 'complaints', label: 'Complaints', icon: 'report_problem' },
  { id: 'my-feedback', label: 'My Feedback', icon: 'history' },
  { id: 'admin', label: 'Admin', icon: 'admin_panel_settings', right: true },
];

const MEAL_SLOTS = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1 cursor-pointer">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={`material-symbols-outlined text-[28px] transition-colors ${(hover || value) >= s ? 'text-[#006e25]' : 'text-[#c2c6d4]'}`}
          style={{ fontVariationSettings: (hover || value) >= s ? "'FILL' 1" : "'FILL' 0" }}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
        >
          star
        </span>
      ))}
    </div>
  );
}

export default function FeedbackPage() {
  const [activeTab, setActiveTab] = useState('ratings');
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});
  const [todayMeals, setTodayMeals] = useState([]);
  const [complaintForm, setComplaintForm] = useState({ category: '', meal: 'LUNCH', description: '' });
  const [myFeedback, setMyFeedback] = useState([]);
  const [adminComplaints, setAdminComplaints] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [adminReply, setAdminReply] = useState('');
  const [feedbackStatusMsg, setFeedbackStatusMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const currentUser = getUser() || {};
  const isAdmin = currentUser.role === 'ADMIN';

  const loadFeedbackData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const mealMap = await messApi.getAllTodayMeals(MEAL_SLOTS).catch(() => ({}));
      const loadedMeals = MEAL_SLOTS.map((slot) => {
        const mealObj = mealMap[slot];
        return {
          slot,
          name: slot.charAt(0) + slot.slice(1).toLowerCase() + ' Service',
          items: mealObj?.items || [],
        };
      });
      setTodayMeals(loadedMeals);

      const todayComplaints = await messApi.getComplaintsToday('LUNCH').catch(() => []);
      if (Array.isArray(todayComplaints)) {
        setAdminComplaints(todayComplaints);
        if (todayComplaints.length > 0) setSelectedAdmin(todayComplaints[0]);
      }
      const reports = await messApi.getMyReports().catch(() => []);
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
      setFeedbackStatusMsg(`Rating for ${mealSlot} submitted!`);
      setTimeout(() => setFeedbackStatusMsg(''), 3000);
    } catch (e) {
      setFeedbackStatusMsg('Failed to submit rating to server.');
    }
  };

  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    if (!complaintForm.description) return;
    try {
      await messApi.raiseComplaint({
        foodItem: complaintForm.category || 'General Quality',
        mealType: complaintForm.meal,
        date: new Date().toISOString().split('T')[0],
        issueType: complaintForm.category || 'Quality',
        comment: complaintForm.description
      });
      setFeedbackStatusMsg('Complaint submitted successfully to mess management.');
      setComplaintForm({ category: '', meal: 'LUNCH', description: '' });
      loadFeedbackData();
      setTimeout(() => setFeedbackStatusMsg(''), 4000);
    } catch (e) {
      setFeedbackStatusMsg('Error submitting complaint.');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto font-[Inter,sans-serif] bg-[#f8f9fa] dark:bg-[#0F172A] text-[#191c1d] dark:text-[#F8FAFC] pb-24 md:pb-8 transition-colors duration-200">
      <main className="p-4 md:p-6 mt-4 md:mt-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[36px] md:text-[45px] font-semibold text-[#003f87] dark:text-[#3B82F6] leading-10 md:leading-[52px]">Feedback & Complaints</h1>
          <p className="text-base text-[#424752] dark:text-[#94A3B8]">Share your dining experience or report issues to improve mess services.</p>
        </div>

        {/* Feedback Alert Status Banner */}
        {feedbackStatusMsg && (
          <div className="mb-6 p-3 bg-[#e8f5ea] dark:bg-[#22C55E]/10 border border-[#006e25]/30 dark:border-[#22C55E]/30 text-[#006e25] dark:text-[#22C55E] rounded-lg text-sm font-medium">
            {feedbackStatusMsg}
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="flex border-b border-[#c2c6d4] dark:border-[#334155] mb-6 overflow-x-auto no-scrollbar gap-6">
          {TABS.filter(t => t.id !== 'admin' || isAdmin).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-colors ${
                activeTab === tab.id
                  ? 'text-[#003f87] dark:text-[#3B82F6] border-b-2 border-[#003f87] dark:border-[#3B82F6] font-bold'
                  : 'text-[#424752] dark:text-[#CBD5E1] hover:text-[#003f87] dark:hover:text-[#3B82F6]'
              } ${tab.right ? 'md:ml-auto' : ''}`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Ratings */}
        {activeTab === 'ratings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {todayMeals.map((card) => (
              <div key={card.slot} className="bg-white border border-[#c2c6d4] rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-[22px] font-medium text-[#191c1d]">{card.name}</h3>
                    <p className="text-[11px] text-[#424752] mt-1">
                      {card.items.length > 0 ? card.items.join(', ') : 'Daily Menu Slot'}
                    </p>
                  </div>
                </div>
                <StarRating value={ratings[card.slot] || 0} onChange={(v) => setRatings((r) => ({ ...r, [card.slot]: v }))} />
                <textarea
                  value={comments[card.slot] || ''}
                  onChange={(e) => setComments((c) => ({ ...c, [card.slot]: e.target.value }))}
                  placeholder="Add feedback comment..."
                  rows={2}
                  className="mt-4 w-full bg-[#f3f4f5] border-b-2 border-[#c2c6d4] focus:border-[#003f87] rounded-t-md p-3 text-sm text-[#191c1d] resize-none outline-none transition-colors"
                />
                <button
                  onClick={() => handleSubmitRating(card.slot)}
                  className={`mt-4 w-full py-2 rounded-lg text-sm font-medium transition-colors ${ratings[card.slot] ? 'bg-[#003f87] text-white hover:opacity-90 shadow-sm' : 'bg-[#e1e3e4] text-[#191c1d] hover:bg-[#d3d4d5]'}`}
                >
                  Submit Rating
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Complaints */}
        {activeTab === 'complaints' && (
          <div className="max-w-2xl mx-auto bg-white border border-[#c2c6d4] rounded-xl p-6 md:p-8">
            <h2 className="text-[22px] font-medium text-[#191c1d] mb-6 border-b border-[#c2c6d4] pb-4">Submit New Complaint</h2>
            <form className="space-y-6" onSubmit={handleComplaintSubmit}>
              <div>
                <label className="block text-sm font-medium text-[#191c1d] mb-2">Category</label>
                <select
                  value={complaintForm.category}
                  onChange={(e) => setComplaintForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full bg-[#f3f4f5] border-b-2 border-[#c2c6d4] focus:border-[#003f87] rounded-t-md p-3 text-sm text-[#191c1d] outline-none transition-colors"
                >
                  <option value="">Select category...</option>
                  <option value="Food Quality">Food Quality (Taste, Spoilage)</option>
                  <option value="Hygiene">Hygiene (Utensils, Dining Area)</option>
                  <option value="Staff Behavior">Service / Staff Behavior</option>
                  <option value="Menu Deviation">Menu Deviation</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#191c1d] mb-2">Meal Session</label>
                <div className="flex gap-6">
                  {['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'].map((m) => (
                    <label key={m} className="flex items-center gap-2 text-sm text-[#191c1d] cursor-pointer">
                      <input
                        type="radio"
                        name="meal"
                        value={m}
                        checked={complaintForm.meal === m}
                        onChange={() => setComplaintForm((f) => ({ ...f, meal: m }))}
                        className="accent-[#003f87]"
                      />
                      {m.charAt(0) + m.slice(1).toLowerCase()}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#191c1d] mb-2">Description</label>
                <textarea
                  value={complaintForm.description}
                  onChange={(e) => setComplaintForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Please provide specific details..."
                  rows={4}
                  className="w-full bg-[#f3f4f5] border-b-2 border-[#c2c6d4] focus:border-[#003f87] rounded-t-md p-3 text-sm text-[#191c1d] resize-none outline-none transition-colors"
                />
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button type="submit" className="px-6 py-2 bg-[#003f87] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors shadow-sm">
                  Submit Complaint
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 3: My Feedback */}
        {activeTab === 'my-feedback' && (
          <div className="bg-white rounded-xl border border-[#c2c6d4] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f3f4f5] border-b border-[#c2c6d4]">
                    {['Date', 'Type', 'Details', 'Status'].map((h) => (
                      <th key={h} className="p-4 text-sm font-semibold text-[#424752]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-[#c2c6d4]">
                  {myFeedback.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-[#424752]">No submitted feedback history found.</td>
                    </tr>
                  ) : (
                    myFeedback.map((row, i) => (
                      <tr key={i} className="hover:bg-[#f9fafb] transition-colors">
                        <td className="p-4 text-[#191c1d] whitespace-nowrap">{row.date || 'Recent'}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 bg-[#e1e3e4] text-[#191c1d] px-2 py-1 rounded text-[11px] font-medium">
                            {row.issueType || 'Complaint'}
                          </span>
                        </td>
                        <td className="p-4 text-[#424752] max-w-xs truncate">{row.comment || row.foodItem}</td>
                        <td className="p-4">
                          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-medium bg-[#006e25]/10 text-[#006e25]">
                            {row.status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Admin Moderation */}
        {activeTab === 'admin' && isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white rounded-xl border border-[#c2c6d4] overflow-hidden h-[600px] flex flex-col">
              <div className="p-4 border-b border-[#c2c6d4] bg-[#f3f4f5] flex justify-between items-center">
                <h3 className="text-[22px] font-medium text-[#191c1d]">Inbox</h3>
                <span className="bg-[#ba1a1a] text-white px-2 py-0.5 rounded-full text-[11px] font-bold">{adminComplaints.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {adminComplaints.map((item) => (
                  <div
                    key={item.id || item._id}
                    onClick={() => setSelectedAdmin(item)}
                    className={`p-4 border-b border-[#c2c6d4] cursor-pointer transition-colors ${selectedAdmin?.id === item.id ? 'bg-[#e8f0f7]' : 'hover:bg-[#f9fafb]'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-bold text-[#191c1d] truncate">{item.foodItem || 'Issue'}</span>
                      <span className="text-[11px] text-[#424752]">{item.mealType}</span>
                    </div>
                    <p className="text-sm text-[#424752] truncate">{item.comment || item.issueType}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white border border-[#c2c6d4] rounded-xl p-6 h-[600px] flex flex-col">
              {selectedAdmin ? (
                <>
                  <div className="flex justify-between items-start border-b border-[#c2c6d4] pb-4 mb-4">
                    <div>
                      <h2 className="text-[22px] font-bold text-[#191c1d]">{selectedAdmin.foodItem || 'Complaint Details'}</h2>
                      <p className="text-[11px] text-[#424752] mt-1">Meal: {selectedAdmin.mealType} • Date: {selectedAdmin.date}</p>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto mb-4 text-sm text-[#191c1d]">
                    <p className="mb-4">"{selectedAdmin.comment || 'No specific description recorded.'}"</p>
                  </div>
                  <div className="mt-auto border-t border-[#c2c6d4] pt-4">
                    <textarea
                      value={adminReply}
                      onChange={(e) => setAdminReply(e.target.value)}
                      placeholder="Type response..."
                      rows={2}
                      className="w-full bg-[#f3f4f5] border-b-2 border-[#c2c6d4] focus:border-[#003f87] rounded-t-md p-3 text-sm text-[#191c1d] resize-none outline-none mb-4"
                    />
                    <button onClick={() => { setFeedbackStatusMsg('Reply sent.'); setAdminReply(''); }} className="px-6 py-2 bg-[#003f87] text-white rounded-lg text-sm font-medium hover:opacity-90">
                      Send Reply
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-[#424752]">
                  <span className="material-symbols-outlined text-[48px] opacity-40 mb-2">inbox</span>
                  <p className="text-sm">Select a complaint to review</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
