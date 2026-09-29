import { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Search,
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  User
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { messApi } from '@/services/mess-api';
import { getUser } from '@/services/auth-service';

export default function AdminManagementPage() {
  const currentAdmin = getUser() || {};
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    user: null,
    targetRole: ''
  });

  const fetchUsers = async (query = '') => {
    setLoading(true);
    try {
      const data = await messApi.getAdminUsers(query);
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch user directory for role management:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(searchQuery);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(searchQuery);
  };

  const handleRoleActionClick = (user, newRole) => {
    setConfirmModal({
      open: true,
      user,
      targetRole: newRole
    });
  };

  const executeRoleChange = async () => {
    const { user, targetRole } = confirmModal;
    if (!user || !targetRole) return;

    setActionLoadingId(user.id);
    setConfirmModal({ open: false, user: null, targetRole: '' });

    try {
      const res = await messApi.updateUserRole(user.id, targetRole);
      setFeedback({
        type: 'success',
        message: res?.message || `Successfully updated ${user.name || user.email} to ${targetRole}.`
      });
      fetchUsers(searchQuery);
    } catch (err) {
      const errMsg = err?.response?.data?.error || err?.message || 'Failed to update user role.';
      setFeedback({
        type: 'error',
        message: errMsg
      });
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const adminCount = users.filter((u) => u.role === 'ADMIN').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Administrative Access & Roles
            </h1>
            <Badge variant="primary" className="text-[11px] font-bold">
              {adminCount} Active Administrators
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Authoritative user privilege control. Only authorized administrators can promote students or demote administrators.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => fetchUsers(searchQuery)}
          className="text-xs gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Directory
        </Button>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-md border flex items-center gap-3 text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-900/40 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Security Notice */}
      <div className="p-4 rounded-md border border-border bg-slate-50/50 dark:bg-slate-800/40 flex items-start gap-3 text-xs">
        <ShieldCheck className="h-4 w-4 text-teal-800 dark:text-teal-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-slate-900 dark:text-slate-100 block">Backend-enforced authorization</span>
          <p className="text-slate-500 leading-relaxed">
            Role elevation is cryptographically authorized and persisted in the database. The system automatically
            rejects any attempt to demote the last remaining administrator to prevent administrative lockout.
          </p>
        </div>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search resident students by name, email, or hostel..."
            className="pl-10 text-xs bg-white dark:bg-slate-900 border-border h-9"
          />
        </div>
        <Button type="submit" size="sm" className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white font-semibold text-xs h-9 px-4">
          Search
        </Button>
      </form>

      {/* Users & Roles Table */}
      <div className="rounded-md border border-border bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">User directory</h3>
          <span className="text-xs text-slate-400">{users.length} users listed</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-teal-800 dark:text-teal-400" />
            Loading user directory...
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No users found matching your search query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-medium text-[11px] border-b border-border">
                <tr>
                  <th className="px-4 py-2.5">User</th>
                  <th className="px-4 py-2.5">Hostel / room</th>
                  <th className="px-4 py-2.5">Academic info</th>
                  <th className="px-4 py-2.5">Role</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => {
                  const isAdmin = u.role === 'ADMIN';
                  const isSelf = u.email === currentAdmin.email;
                  const isOperating = actionLoadingId === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`h-7 w-7 rounded flex items-center justify-center font-bold text-xs ${
                              isAdmin
                                ? 'bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {isAdmin ? <Shield className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                              {u.name || u.email?.split('@')[0]}
                              {isSelf && (
                                <span className="ml-1 text-[10px] text-teal-700 dark:text-teal-400">(You)</span>
                              )}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {u.hostel || 'Hostel N/A'}{u.room ? ` • Rm ${u.room}` : ''}
                      </td>

                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {u.branch || 'General'}{u.year ? ` • Year ${u.year}` : ''}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          isAdmin
                            ? 'bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        {isAdmin ? (
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={isOperating}
                            onClick={() => handleRoleActionClick(u, 'STUDENT')}
                            className="text-xs font-semibold h-7 px-2.5 gap-1"
                          >
                            <UserX className="h-3 w-3" />
                            Demote to Student
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isOperating}
                            onClick={() => handleRoleActionClick(u, 'ADMIN')}
                            className="text-xs font-semibold h-7 px-2.5 gap-1 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/40"
                          >
                            <UserCheck className="h-3 w-3" />
                            Promote to Admin
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal (Section 32) */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-surface rounded-lg p-5 border border-border shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`h-9 w-9 rounded-md flex items-center justify-center ${
                  confirmModal.targetRole === 'STUDENT'
                    ? 'bg-red-50 dark:bg-red-950/40 text-red-600'
                    : 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400'
                }`}
              >
                <ShieldAlert className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text">
                  Confirm Privilege Change
                </h3>
                <p className="text-xs text-text-secondary">Authoritative role assignment</p>
              </div>
            </div>

            <p className="text-xs text-text leading-relaxed">
              Are you sure you want to change the role of{' '}
              <strong className="text-text">{confirmModal.user?.name || confirmModal.user?.email}</strong> to{' '}
              <strong className={confirmModal.targetRole === 'ADMIN' ? 'text-primary' : 'text-danger'}>
                {confirmModal.targetRole}
              </strong>
              ?
              {confirmModal.targetRole === 'STUDENT' && (
                <span className="block mt-2 text-danger font-medium">
                  This user will immediately lose access to all admin operations and dashboards.
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmModal({ open: false, user: null, targetRole: '' })}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant={confirmModal.targetRole === 'STUDENT' ? 'danger' : 'primary'}
                onClick={executeRoleChange}
                className="text-xs font-bold"
              >
                Confirm Role Change
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
