import { useState, useEffect } from 'react';
import { getUser } from '@/services/auth-service';
import { messApi } from '@/services/mess-api';
import {
  Bell,
  AlertTriangle,
  Calendar,
  Clock,
  Plus,
  Tag,
  Filter,
  CheckCircle2,
  X,
  Megaphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';

const INITIAL_NOTICES = [
  {
    id: 'n-1',
    title: 'Dinner Timing Shift Today',
    priority: 'IMPORTANT',
    category: 'MENU',
    message: 'Dinner service will commence at 7:00 PM instead of 6:30 PM today due to kitchen deep-cleaning and gas pipeline maintenance.',
    date: 'Sep 28, 2026',
    time: '4:20 PM',
    expiresAt: 'Tonight, 11:59 PM',
    author: 'Chief Mess Warden'
  },
  {
    id: 'n-2',
    title: 'Weekend Feast Consensus Poll Live',
    priority: 'NORMAL',
    category: 'EVENTS',
    message: 'The consensus poll for Saturday dinner is now open in the Polls section. Cast your vote before Friday midnight.',
    date: 'Sep 27, 2026',
    time: '11:00 AM',
    expiresAt: 'Friday, 11:59 PM',
    author: 'Student Mess Committee'
  },
  {
    id: 'n-3',
    title: 'RO Water Plant Filter Sanitization',
    priority: 'IMPORTANT',
    category: 'FACILITIES',
    message: 'Dining hall RO water dispensers on Block A side are scheduled for membrane sanitization between 3:00 PM and 4:30 PM. Alternative dispensers on Block B side remain operational.',
    date: 'Sep 26, 2026',
    time: '2:15 PM',
    expiresAt: 'Sep 29, 2026',
    author: 'Hostel Maintenance'
  }
];

export default function NoticesPage() {
  const currentUser = getUser() || {};
  const isAdmin = currentUser.role === 'ADMIN';

  const [notices, setNotices] = useState(() => {
    const saved = localStorage.getItem('hostel_mess_notices');
    return saved ? JSON.parse(saved) : INITIAL_NOTICES;
  });

  const [activeFilter, setActiveFilter] = useState('ALL');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'MENU',
    priority: 'IMPORTANT',
    message: '',
    expiresAt: 'Tonight 11:59 PM'
  });
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    // Also attempt fetching from backend announcements API
    messApi.getAnnouncements().then((apiNotices) => {
      if (Array.isArray(apiNotices) && apiNotices.length > 0) {
        const mapped = apiNotices.map((n) => ({
          id: n.id,
          title: n.title,
          priority: n.priority || 'NORMAL',
          category: n.category || 'MENU',
          message: n.message,
          date: n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Today',
          time: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
          author: 'Mess Administration'
        }));
        setNotices((prev) => {
          const merged = [...mapped, ...prev.filter((p) => !mapped.some((m) => m.id === p.id))];
          localStorage.setItem('hostel_mess_notices', JSON.stringify(merged));
          return merged;
        });
      }
    }).catch(() => {});
  }, []);

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return;

    const newNotice = {
      id: `notice-${Date.now()}`,
      title: form.title,
      priority: form.priority,
      category: form.category,
      message: form.message,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      expiresAt: form.expiresAt,
      author: currentUser.name || 'Mess Administration'
    };

    // Attempt backend save
    messApi.createAnnouncement({
      title: form.title,
      message: form.message,
      priority: form.priority,
      category: form.category
    }).catch(() => {});

    const updated = [newNotice, ...notices];
    setNotices(updated);
    localStorage.setItem('hostel_mess_notices', JSON.stringify(updated));

    setCreateModalOpen(false);
    setForm({ title: '', category: 'MENU', priority: 'IMPORTANT', message: '', expiresAt: 'Tonight 11:59 PM' });
    setSuccessMsg('Notice published and broadcasted to all students!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const filteredNotices = notices.filter((n) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'IMPORTANT') return n.priority === 'IMPORTANT';
    return n.category === activeFilter;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-0 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Official Mess Notices & Broadcasts"
          subtitle="Real-time circulars regarding meal timings, emergency replacements, and dining announcements."
          badge="Broadcast Channel"
        />

        {isAdmin && (
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 shrink-0 shadow-sm"
          >
            <Plus className="h-4 w-4" /> Publish New Notice
          </Button>
        )}
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-sm font-semibold">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {['ALL', 'IMPORTANT', 'MENU', 'EVENTS', 'FACILITIES'].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeFilter === filter
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {filter === 'IMPORTANT' ? '🔴 IMPORTANT' : filter}
          </button>
        ))}
      </div>

      {/* Notices Cards */}
      <div className="space-y-4">
        {filteredNotices.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8">
            <Bell className="h-8 w-8 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No notices in this category</p>
            <p className="text-xs text-slate-400 mt-1">Check back later or choose another filter.</p>
          </div>
        ) : (
          filteredNotices.map((notice) => {
            const isImportant = notice.priority === 'IMPORTANT';

            return (
              <Card
                key={notice.id}
                className={`border-l-4 transition-all bg-white dark:bg-slate-900/90 shadow-xs hover:shadow-sm ${
                  isImportant
                    ? 'border-l-rose-500 border-slate-200 dark:border-slate-800'
                    : 'border-l-blue-500 border-slate-200 dark:border-slate-800'
                }`}
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isImportant && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-[10px] font-black uppercase tracking-wider">
                          <AlertTriangle className="h-3 w-3" /> Important
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        {notice.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{notice.date} • {notice.time}</span>
                    </div>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    {notice.title}
                  </h3>

                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {notice.message}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Issued by: <strong className="text-slate-700 dark:text-slate-300">{notice.author}</strong></span>
                    {notice.expiresAt && (
                      <span className="italic">Valid until: {notice.expiresAt}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Admin Publish Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                  Publish Official Notice
                </h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Notice Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dinner Timing Changed"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold"
                  >
                    <option value="IMPORTANT">🔴 IMPORTANT</option>
                    <option value="NORMAL">NORMAL</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold"
                  >
                    <option value="MENU">MENU</option>
                    <option value="EVENTS">EVENTS</option>
                    <option value="FACILITIES">FACILITIES</option>
                    <option value="GENERAL">GENERAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Description / Circular Body</label>
                <textarea
                  rows={4}
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Detail the announcement, alternate arrangements, or action required by students..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs leading-relaxed"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Expiry Description</label>
                <input
                  type="text"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  placeholder="e.g. Tonight 11:59 PM or In 3 days"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                  Publish Broadcast
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
