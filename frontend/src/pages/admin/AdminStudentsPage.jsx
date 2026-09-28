import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  RefreshCw,
  User,
  Shield,
  ExternalLink,
  X,
  Mail,
  Building,
  GraduationCap
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { messApi } from '@/services/mess-api';

export default function AdminStudentsPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const loadStudents = async (query = '') => {
    setLoading(true);
    try {
      const data = await messApi.getAdminUsers(query);
      if (Array.isArray(data)) {
        setStudents(data);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents(searchQuery);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadStudents(searchQuery);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Resident Student Management
            </h1>
            <Badge variant="primary" className="text-[11px] font-bold">
              {students.length} Registered Diners
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Official student directory with residential block assignments, room numbers, and academic information.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => loadStudents(searchQuery)}
          className="text-xs gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Directory
        </Button>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students by name, email, hostel, room, or branch..."
            className="pl-10 text-xs bg-surface border-border h-10"
          />
        </div>
        <Button type="submit" size="sm" className="font-bold text-xs h-10 px-4">
          Search
        </Button>
      </form>

      {/* Students Table (Section 31) */}
      <Card className="bg-surface border-border overflow-hidden">
        <div className="p-4 bg-surface-elevated border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-text">Resident Directory Roster</h3>
          <span className="text-xs text-text-secondary">{students.length} Total Records</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-text-muted">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
            Loading resident student records...
          </div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center text-xs text-text-muted">
            No students found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-elevated text-text-secondary uppercase tracking-wider text-[10px] border-b border-border">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Hostel</th>
                  <th className="px-4 py-3">Room</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3">Year</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map((st) => {
                  const isAdmin = st.role === 'ADMIN';

                  return (
                    <tr key={st.id} className="hover:bg-surface-elevated/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-text flex items-center gap-2">
                        <div className="h-7 w-7 rounded-md bg-surface-elevated border border-border flex items-center justify-center text-xs font-bold text-text-secondary">
                          {(st.name || st.email || 'S').slice(0, 2).toUpperCase()}
                        </div>
                        <span>{st.name || st.email?.split('@')[0]}</span>
                      </td>

                      <td className="px-4 py-3 font-mono text-text-secondary">
                        {st.email}
                      </td>

                      <td className="px-4 py-3 text-text">
                        {st.hostel || 'Unassigned'}
                      </td>

                      <td className="px-4 py-3 text-text font-medium">
                        {st.room ? `Room ${st.room}` : '—'}
                      </td>

                      <td className="px-4 py-3 text-text-secondary">
                        {st.branch || '—'}
                      </td>

                      <td className="px-4 py-3 text-text-secondary">
                        {st.year ? `Year ${st.year}` : '—'}
                      </td>

                      <td className="px-4 py-3">
                        <Badge variant={isAdmin ? 'primary' : 'default'} className="text-[10px]">
                          {st.role || 'STUDENT'}
                        </Badge>
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedStudent(st)}
                            className="p-1.5 rounded-md border border-border text-text-secondary hover:text-text hover:bg-surface-elevated cursor-pointer"
                            title="View Student Details"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Student Details Modal (Section 31) */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-surface rounded-lg p-5 border border-border shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-md bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 flex items-center justify-center font-bold">
                  <User className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text">
                    {selectedStudent.name || selectedStudent.email?.split('@')[0]}
                  </h3>
                  <p className="text-xs text-text-secondary">Resident Profile Summary</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 rounded-md hover:bg-surface-elevated text-text-muted hover:text-text cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-text-secondary">Email</span>
                <span className="font-mono text-text">{selectedStudent.email}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-text-secondary">Hostel Block</span>
                <span className="font-bold text-text">{selectedStudent.hostel || 'Not Assigned'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-text-secondary">Room Allocation</span>
                <span className="font-bold text-text">{selectedStudent.room ? `Room ${selectedStudent.room}` : 'Not Allocated'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-text-secondary">Academic Branch</span>
                <span className="text-text">{selectedStudent.branch || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-text-secondary">Academic Year</span>
                <span className="text-text">{selectedStudent.year || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-text-secondary">Account Role</span>
                <Badge variant={selectedStudent.role === 'ADMIN' ? 'primary' : 'default'} className="text-[10px]">
                  {selectedStudent.role}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedStudent(null);
                  navigate('/admin/management');
                }}
                className="text-xs text-primary border-primary/30"
              >
                Manage Role in Access Control →
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedStudent(null)} className="text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
