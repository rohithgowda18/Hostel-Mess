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
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 text-xs"
          >
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Stats (User Spec #12) */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Expected Diners</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{expectedCount.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Checked In</p>
            <p className="text-2xl font-black text-blue-600 mt-1">{checkedInCount.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Turnout Rate</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{attendancePct}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Meal Slot Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER', 'ALL'].map((slot) => (
          <button
            key={slot}
            onClick={() => setSelectedMeal(slot)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedMeal === slot
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {slot}
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
          className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300"
        >
          <option value="ALL">All Blocks</option>
          <option value="A">Block A</option>
          <option value="B">Block B</option>
          <option value="C">Block C</option>
        </select>
      </div>

      {/* Attendance Table */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-3.5 pl-4">Student</th>
                <th className="p-3.5">Block</th>
                <th className="p-3.5">Room</th>
                <th className="p-3.5">Meal Slot</th>
                <th className="p-3.5">Check-in Time</th>
                <th className="p-3.5">Verification</th>
                <th className="p-3.5 text-right pr-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
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
                      <p className="font-bold text-slate-900 dark:text-slate-100">{item.student}</p>
                      <p className="text-[10px] text-slate-400">{item.email}</p>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300">
                      Block {item.block}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300">
                      {item.room}
                    </td>
                    <td className="p-3.5">
                      <Badge variant="neutral" className="text-[10px] font-bold">
                        {item.meal}
                      </Badge>
                    </td>
                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                      {item.time}
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {item.method}
                    </td>
                    <td className="p-3.5 text-right pr-4">
                      <Badge variant="success" className="text-[10px] font-bold">
                        ✓ Present
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
