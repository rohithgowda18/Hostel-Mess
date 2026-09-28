import { useState, useEffect } from 'react';
import { getUser } from '@/services/auth-service';
import { messApi } from '@/services/mess-api';
import {
  Bell,
  AlertTriangle,
  Clock,
  Plus,
  CheckCircle2,
  X,
  Pin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const INITIAL_NOTICES = [
  {
    id: 'n-1',
    title: 'Dinner Timing Shift Today',
    priority: 'IMPORTANT',
    category: 'TIMINGS',
    message: 'Dinner service will commence at 7:30 PM today due to kitchen deep-cleaning and gas pipeline maintenance.',
    date: 'Sep 28, 2026',
    time: '4:20 PM'
  },
  {
    id: 'n-2',
    title: 'Weekend Special Dining Menu Published',
    priority: 'NORMAL',
    category: 'MENU',
    message: 'Saturday lunch and dinner menus have been updated with special festive meal offerings. View the weekly menu tab for details.',
    date: 'Sep 27, 2026',
    time: '11:00 AM'
  },
  {
    id: 'n-3',
    title: 'RO Water Plant Filter Sanitization Complete',
    priority: 'NORMAL',
    category: 'FACILITIES',
    message: 'Dining hall RO water dispensers have been fully serviced and water testing certified.',
    date: 'Sep 26, 2026',
    time: '2:15 PM'
  }
];

export default function NoticesPage() {
  const currentUser = getUser() || {};
  const isAdmin = currentUser.role === 'ADMIN';

  const [notices, setNotices] = useState(() => {
    const saved = localStorage.getItem('hostel_mess_notices');
    return saved ? JSON.parse(saved) : INITIAL_NOTICES;
  });

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'MENU',
    priority: 'IMPORTANT',
    message: ''
  });
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    messApi.getAnnouncements().then((apiNotices) => {
      if (Array.isArray(apiNotices) && apiNotices.length > 0) {
        const mapped = apiNotices.map((n) => ({
          id: n.id || n._id,
          title: n.title,
          priority: n.priority || 'NORMAL',
          category: n.category || 'MENU',
          message: n.message,
          date: n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Today',
          time: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'
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
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

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
    setForm({ title: '', category: 'MENU', priority: 'IMPORTANT', message: '' });
    setSuccessMsg('Notice published and broadcasted to residents.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const pinnedNotice = notices.find((n) => n.priority === 'IMPORTANT');
  const recentNotices = notices.filter((n) => n !== pinnedNotice);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black text-text tracking-tight">
              Hostel Mess Notices
            </h1>
            <Badge variant="primary" className="text-[11px] font-bold">
              Official Circulars
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Official dining announcements regarding service schedules, replacements, and facility updates.
          </p>
        </div>

        {isAdmin && (
          <Button
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="bg-primary hover:bg-primary-hover text-white font-bold gap-1.5 text-xs self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5" /> Publish Notice
          </Button>
        )}
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-success/10 border border-success/30 text-success text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Pinned Notice at Top (Section 20) */}
      {pinnedNotice && (
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
            <Pin className="h-3.5 w-3.5 text-primary" /> Pinned Important Circular
          </span>
          <Card className="bg-surface border-l-4 border-l-primary border-border p-5 space-y-3 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
                  <AlertTriangle className="h-3 w-3" /> Priority Notice
                </span>
                <span className="px-2 py-0.5 rounded-md bg-surface-elevated text-text-secondary text-[10px] font-bold uppercase tracking-wider border border-border">
                  {pinnedNotice.category}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                <Clock className="h-3.5 w-3.5" />
                <span>{pinnedNotice.date} • {pinnedNotice.time}</span>
              </div>
            </div>

            <h3 className="text-base font-bold text-text">{pinnedNotice.title}</h3>
            <p className="text-xs text-text-secondary leading-relaxed">{pinnedNotice.message}</p>
          </Card>
        </div>
      )}

      {/* Recent Notices List (Section 20) */}
      <div className="space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary block">
          Recent Circulars ({recentNotices.length})
        </span>

        {recentNotices.length === 0 ? (
          <div className="text-center py-12 bg-surface border border-border rounded-2xl p-8">
            <Bell className="h-8 w-8 text-text-muted mx-auto mb-2 opacity-50" />
            <p className="text-xs font-bold text-text">No additional notices posted</p>
          </div>
        ) : (
          recentNotices.map((n) => (
            <Card key={n.id} className="bg-surface border-border p-4 space-y-2 hover:border-primary/40 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-surface-elevated text-text-secondary text-[10px] font-bold uppercase tracking-wider border border-border">
                    {n.category}
                  </span>
                  <h4 className="text-sm font-bold text-text">{n.title}</h4>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                  <Clock className="h-3 w-3" />
                  <span>{n.date}</span>
                </div>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">{n.message}</p>
            </Card>
          ))
        )}
      </div>

      {/* Admin Publish Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-surface rounded-2xl p-5 border border-border shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-text">Publish Official Mess Notice</h3>
                <p className="text-xs text-text-secondary">Broadcast to all hostel resident dining portals</p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-text block mb-1">Notice Headline</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Service Timing Shift Today"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-xs text-text"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-text block mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-xs text-text"
                  >
                    <option value="IMPORTANT">IMPORTANT (Pinned)</option>
                    <option value="NORMAL">NORMAL</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-text block mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-xs text-text"
                  >
                    <option value="MENU">MENU</option>
                    <option value="TIMINGS">TIMINGS</option>
                    <option value="FACILITIES">FACILITIES</option>
                    <option value="GENERAL">GENERAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-text block mb-1">Notice Description</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide precise details for dining residents..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface-elevated p-3 text-xs text-text"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-primary hover:bg-primary-hover text-white font-bold text-xs">
                  Broadcast Notice
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
