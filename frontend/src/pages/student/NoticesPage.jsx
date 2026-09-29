import { useState, useEffect } from 'react';
import { getUser } from '@/services/auth-service';
import { messApi } from '@/services/mess-api';
import { usePageTitle } from '@/hooks/use-page-title';
import { useToast } from '@/context/toast-context';
import { EmptyState } from '@/components/ui/empty-state';
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

export default function NoticesPage() {
  const currentUser = getUser() || {};
  const isAdmin = currentUser.role === 'ADMIN';
  const toast = useToast();
  usePageTitle('Hostel Notices', 'Announcements, kitchen schedule updates, and mess administration notices.');

  const [notices, setNotices] = useState(() => {
    const saved = localStorage.getItem('hostel_mess_notices');
    return saved ? JSON.parse(saved) : [];
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
        setNotices(mapped);
        localStorage.setItem('hostel_mess_notices', JSON.stringify(mapped));
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
    toast.success('Notice Published', `"${newNotice.title}" has been broadcast to residents.`);
  };

  const pinnedNotice = notices.find((n) => n.priority === 'IMPORTANT');
  const recentNotices = notices.filter((n) => n !== pinnedNotice);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-on-surface">
            Notices & Circulars
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Hostel mess announcements, service timing adjustments, and dining updates.
          </p>
        </div>

        {isAdmin && (
          <Button
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="text-xs font-semibold bg-primary hover:bg-primary-container text-on-primary shrink-0"
          >
            Publish Notice
          </Button>
        )}
      </div>

      {/* Pinned Notice at Top */}
      {pinnedNotice && (
        <div className="space-y-2 p-4 rounded-xl border-l-4 border-l-primary bg-surface-container-low border border-outline-variant/20 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-primary flex items-center gap-1.5">
              <Pin className="h-3.5 w-3.5" />
              Pinned Notice • {pinnedNotice.category}
            </span>
            <span className="text-on-surface-variant font-mono text-[11px]">
              {pinnedNotice.date}
            </span>
          </div>

          <h2 className="text-sm font-bold text-on-surface">
            {pinnedNotice.title}
          </h2>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {pinnedNotice.message}
          </p>
        </div>
      )}

      {/* Regular Notices List */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-on-surface">
          Recent Bulletins
        </h2>

        {recentNotices.length === 0 && !pinnedNotice ? (
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/20 shadow-xs">
            <EmptyState
              icon={Bell}
              title="No Notices Active"
              description="The hostel mess administration has not published any announcements for today."
            />
          </div>
        ) : recentNotices.length === 0 ? (
          <p className="text-xs text-on-surface-variant py-4 italic">
            No additional announcements beyond the pinned notice above.
          </p>
        ) : (
          <div className="divide-y divide-border border-y border-border">
            {recentNotices.map((n) => (
              <div key={n.id} className="py-3.5 space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>{n.category}</span>
                  <span className="font-mono">{n.date}</span>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                  {n.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                  {n.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Publish Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-surface rounded-lg p-5 border border-border shadow-xl space-y-4">
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
                  className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2 text-xs text-text"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-text block mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2 text-xs text-text"
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
                    className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2 text-xs text-text"
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
                  className="w-full rounded-md border border-border bg-surface-elevated p-3 text-xs text-text"
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
