import { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  User,
  Building,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { messApi } from '@/services/mess-api';

export default function AdminAttendancePage() {
  const [selectedMeal, setSelectedMeal] = useState('LUNCH');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('ALL');
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ expected: 0, checkedIn: 0 });

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const loadAttendanceData = async () => {
      setLoading(true);
      try {
        const [rosterData, services] = await Promise.all([
          messApi.getAttendanceRoster(selectedMeal, todayStr).catch(() => []),
          messApi.getTodayMealServices().catch(() => [])
        ]);

        setRoster(Array.isArray(rosterData) ? rosterData : []);

        if (Array.isArray(services) && services.length > 0) {
          const active = selectedMeal === 'ALL'
            ? services.reduce((acc, s) => ({
                expected: acc.expected + (s.expectedAttendance || 0),
                checkedIn: acc.checkedIn + (s.actualAttendance || 0)
              }), { expected: 0, checkedIn: 0 })
            : services.find((s) => s.mealType === selectedMeal) || { expectedAttendance: 0, actualAttendance: 0 };
          setCounts({
            expected: active.expected || active.expectedAttendance || (rosterData.length > 0 ? rosterData.length : 1),
            checkedIn: active.checkedIn || active.actualAttendance || rosterData.filter((r) => r.present).length
          });
        } else {
          setCounts({
            expected: rosterData.length || 1,
            checkedIn: rosterData.filter((r) => r.present).length
          });
        }
      } catch (err) {
        console.error('Failed to load roster:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAttendanceData();
  }, [selectedMeal, todayStr]);

  const expectedCount = counts.expected;
  const checkedInCount = counts.checkedIn;
  const attendancePct = expectedCount > 0 ? ((checkedInCount / expectedCount) * 100).toFixed(1) : 0;

  const filteredRoster = roster.filter((item) => {
    const matchesMeal = selectedMeal === 'ALL' || item.meal === selectedMeal;
    const matchesBlock = selectedBlock === 'ALL' || item.block === selectedBlock;
    const matchesSearch =
      !searchQuery ||
      item.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.room.includes(searchQuery);
    return matchesMeal && matchesBlock && matchesSearch;
  });

  const handleExportCsv = () => {
    const header = 'Student Name,Email,Block,Room,Meal Slot,Check-in Time,Verification Method\n';
    const rows = filteredRoster
      .map((r) => `"${r.student}","${r.email}","${r.block}","${r.room}","${r.meal}","${r.time}","${r.method}"`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mess_attendance_${selectedMeal.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-0 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Attendance & Check-in Roster"
          subtitle="Real-time dining hall check-ins, automated meal validation logs, and audit export."
          badge="Live Roster"
        />

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleExportCsv}
            className="font-bold gap-2 text-xs"
          >
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Attendance Metric Bar */}
      <div className="grid grid-cols-3 divide-x divide-border border border-border rounded-md bg-white dark:bg-slate-900 py-3">
        <div className="px-5 py-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 block">Expected diners</span>
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100 block mt-0.5">
            {expectedCount.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-400">RSVP / enrollment count</span>
        </div>

        <div className="px-5 py-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 block">Checked in</span>
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100 block mt-0.5">
            {checkedInCount.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-400">Dining pass scans</span>
        </div>

        <div className="px-5 py-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 block">Turnout rate</span>
          <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400 block mt-0.5">
            {attendancePct}%
          </span>
          <span className="text-[11px] text-slate-400">Actual vs expected</span>
        </div>
      </div>

      {/* Meal Slot Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER', 'ALL'].map((slot) => (
          <button
            key={slot}
            onClick={() => setSelectedMeal(slot)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
              selectedMeal === slot
                ? 'bg-teal-800 text-white dark:bg-teal-700'
                : 'bg-white dark:bg-slate-900 border border-border text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {slot.charAt(0) + slot.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Search and Block Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search student by name, email, or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <select
          value={selectedBlock}
          onChange={(e) => setSelectedBlock(e.target.value)}
          className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300"
        >
          <option value="ALL">All Blocks</option>
          <option value="A">Block A</option>
          <option value="B">Block B</option>
          <option value="C">Block C</option>
        </select>
      </div>

      {/* Attendance Table */}
      <div className="rounded-md border border-border bg-white dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-border text-[11px] font-medium text-slate-600 dark:text-slate-400">
              <tr>
                <th className="p-3.5 pl-4">Student</th>
                <th className="p-3.5">Block</th>
                <th className="p-3.5">Room</th>
                <th className="p-3.5">Meal slot</th>
                <th className="p-3.5">Check-in time</th>
                <th className="p-3.5">Verification</th>
                <th className="p-3.5 text-right pr-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No matching check-ins found.
                  </td>
                </tr>
              ) : (
                filteredRoster.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 pl-4">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{item.student}</p>
                      <p className="text-[10px] text-slate-400">{item.email}</p>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">
                      Block {item.block}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">
                      {item.room}
                    </td>
                    <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">
                      {item.meal}
                    </td>
                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                      {item.time}
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {item.method}
                    </td>
                    <td className="p-3.5 text-right pr-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> Checked in
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
