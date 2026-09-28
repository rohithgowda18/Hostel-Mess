import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  ClipboardCheck,
  MessageSquareWarning,
  Trash2,
  Star,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  UtensilsCrossed,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalStudents: 1240,
    expectedToday: 1087,
    checkedIn: 827,
    openComplaints: 17,
    wasteKg: 34,
    foodRating: 4.2,
    hallOccupancy: 68,
    slaScore: 91
  });

  const attendanceRate = Math.round((stats.checkedIn / stats.expectedToday) * 100);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-0 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Mess Operations Console
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Operational
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Warden & Management Operations • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => navigate('/admin/attendance')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
          >
            Live Attendance
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/admin/menu')}
            className="text-xs"
          >
            Manage Menu
          </Button>
        </div>
      </div>

      {/* Row 1 KPIs (User Spec #10) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Students Enrolled</span>
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {stats.totalStudents.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-400">All hostel blocks</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Today's Expected</span>
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {stats.expectedToday.toLocaleString()}
            </p>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">RSVP confirmed diners</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Checked In</span>
              <ClipboardCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {stats.checkedIn.toLocaleString()}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              {attendanceRate}% of expected
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Open Complaints</span>
              <MessageSquareWarning className="h-4 w-4 text-rose-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {stats.openComplaints}
            </p>
            <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">5 require investigation</p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2 KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Today's Waste</span>
              <Trash2 className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {stats.wasteKg} <span className="text-sm font-semibold text-slate-400">kg</span>
            </p>
            <p className="text-[11px] text-slate-400">Edible + plate combined</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Food Rating</span>
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {stats.foodRating} <span className="text-sm font-semibold text-slate-400">/ 5.0</span>
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">+0.3 from last week</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Hall Occupancy</span>
              <Activity className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {stats.hallOccupancy}%
            </p>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">Moderate queue flow</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Contractor SLA</span>
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {stats.slaScore}%
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Within compliance band</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Operational Grids */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Live Dining Attendance & Alerts */}
        <div className="lg:col-span-8 space-y-6">
          {/* Live Dining Gauge */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Real-Time Dining</span>
                  <CardTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    Lunch Service Turnout
                  </CardTitle>
                </div>
                <Badge variant="outline" className="text-xs font-bold text-blue-600">
                  Window: 12:30 PM — 02:30 PM
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <p className="text-xs text-slate-400">Expected</p>
                  <p className="text-lg font-black text-slate-900 dark:text-slate-100">{stats.expectedToday}</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl">
                  <p className="text-xs text-blue-600 dark:text-blue-400">Checked In</p>
                  <p className="text-lg font-black text-blue-700 dark:text-blue-300">{stats.checkedIn}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <p className="text-xs text-slate-400">Remaining</p>
                  <p className="text-lg font-black text-slate-700 dark:text-slate-300">{stats.expectedToday - stats.checkedIn}</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">
                  <span>Attendance Progress</span>
                  <span>{attendanceRate}% complete</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${attendanceRate}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 text-xs">
                <span className="text-slate-400">Estimated queue delay: <strong>~3 mins</strong></span>
                <button
                  onClick={() => navigate('/admin/attendance')}
                  className="text-blue-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  View Full Check-in Roster <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Operational Alerts */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Operational Alerts & Anomalies
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Food waste is 18% above weekly average</p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                    Rice batch over-preparation observed in Lunch. Advise kitchen supervisor to calibrate to 98 kg for tomorrow.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-900 dark:text-rose-200">
                <MessageSquareWarning className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">3 unresolved grievances older than 24 hours</p>
                  <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                    Tickets CMP-1018, CMP-1019, CMP-1021 require warden signoff to prevent SLA penalty breaches.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-900 dark:text-emerald-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Lunch attendance matches AI turnout forecast (98.4% accuracy)</p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                    No emergency menu substitutions triggered today.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Menu Status & Open Issues */}
        <div className="lg:col-span-4 space-y-6">
          {/* Menu Publication Status */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                <span>Today's Menu Status</span>
                <UtensilsCrossed className="h-4 w-4 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              {[
                { slot: 'Breakfast', status: 'Published', published: true, time: '7:30 – 9:30 AM' },
                { slot: 'Lunch', status: 'Published', published: true, time: '12:30 – 2:30 PM' },
                { slot: 'Snacks', status: 'Published', published: true, time: '4:30 – 5:30 PM' },
                { slot: 'Dinner', status: 'Pending Review', published: false, time: '7:30 – 9:30 PM' }
              ].map((m) => (
                <div
                  key={m.slot}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">{m.slot}</p>
                    <p className="text-[10px] text-slate-400">{m.time}</p>
                  </div>
                  <Badge
                    variant={m.published ? 'success' : 'warning'}
                    className="text-[10px] font-bold"
                  >
                    {m.published ? '✓ Published' : '⚠ Pending'}
                  </Badge>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/menu')}
                className="w-full text-xs font-bold mt-2"
              >
                Open Menu Builder
              </Button>
            </CardContent>
          </Card>

          {/* Open Issues Breakdown */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Open Issues by Category
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              {[
                { label: 'Food Quality', count: 8, color: 'bg-rose-500' },
                { label: 'Hygiene & Cleanliness', count: 4, color: 'bg-amber-500' },
                { label: 'Staff Behavior', count: 2, color: 'bg-blue-500' },
                { label: 'Facilities & Other', count: 3, color: 'bg-purple-500' }
              ].map((issue) => (
                <div key={issue.label} className="space-y-1">
                  <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                    <span>{issue.label}</span>
                    <span>{issue.count}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full ${issue.color} rounded-full`}
                      style={{ width: `${(issue.count / 17) * 100}%` }}
                    />
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/complaints')}
                className="w-full text-xs font-bold mt-2"
              >
                Go to Resolution Desk
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
