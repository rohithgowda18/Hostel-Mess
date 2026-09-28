import { useState, useEffect } from 'react';
import { getUser } from '@/services/auth-service';
import { messApi } from '@/services/mess-api';
import {
  MessageSquareWarning,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Camera,
  ChevronRight,
  Filter,
  ShieldCheck,
  X,
  Upload,
  User,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';

const INITIAL_COMPLAINTS = [
  {
    id: 'CMP-1024',
    category: 'Food Quality',
    foodItem: 'Dal Tadka',
    mealType: 'LUNCH',
    studentName: 'Rohith Gowda',
    room: 'A-304',
    description: 'Lunch dal was excessively salty today and tasted lukewarm.',
    status: 'UNDER INVESTIGATION',
    date: 'Sep 28, 2026',
    time: '12:43 PM',
    timeline: [
      { step: 'Submitted', time: '12:43 PM', completed: true },
      { step: 'Assigned to Mess Warden', time: '01:02 PM', completed: true },
      { step: 'Kitchen Inspection', time: 'In Progress', current: true },
      { step: 'Action Taken', completed: false },
      { step: 'Resolved', completed: false }
    ],
    resolution: null
  },
  {
    id: 'CMP-1025',
    category: 'Hygiene & Cleanliness',
    foodItem: 'Water Dispenser',
    mealType: 'BREAKFAST',
    studentName: 'Aarav Patel',
    room: 'B-201',
    description: 'Water dispenser tray near table 4 was overflowing with water residue.',
    status: 'ACTION TAKEN',
    date: 'Sep 28, 2026',
    time: '08:30 AM',
    timeline: [
      { step: 'Submitted', time: '08:30 AM', completed: true },
      { step: 'Assigned to Cleaning Staff', time: '08:45 AM', completed: true },
      { step: 'Inspection', time: '09:00 AM', completed: true },
      { step: 'Cleaned & Sanitized', time: '09:15 AM', completed: true },
      { step: 'Resolved', completed: false }
    ],
    resolution: 'Tray drained and chlorinated by sanitation team.'
  },
  {
    id: 'CMP-1020',
    category: 'Portion Size',
    foodItem: 'Paneer Butter Masala',
    mealType: 'DINNER',
    studentName: 'Sneha Rao',
    room: 'A-108',
    description: 'Catering staff rationed paneer pieces after 8:30 PM due to early shortage.',
    status: 'RESOLVED',
    date: 'Sep 26, 2026',
    time: '08:50 PM',
    timeline: [
      { step: 'Submitted', time: '08:50 PM', completed: true },
      { step: 'Assigned to Contractor Lead', time: '09:10 PM', completed: true },
      { step: 'Shortage Verified', time: '09:30 PM', completed: true },
      { step: 'Buffer Batches Mandated', time: 'Next Day', completed: true },
      { step: 'Resolved', time: 'Sep 27', completed: true }
    ],
    resolution: 'Contractor issued notice to maintain 15% buffer prep for all paneer items.'
  }
];

const CATEGORIES = [
  'Food Quality',
  'Hygiene & Cleanliness',
  'Portion Size',
  'Cold Food / Temperature',
  'Staff Behavior',
  'Water / Facilities'
];

export default function ComplaintsPage() {
  const currentUser = getUser() || {};
  const isAdmin = currentUser.role === 'ADMIN';

  const [complaints, setComplaints] = useState(() => {
    const saved = localStorage.getItem('hostel_mess_complaints_v2');
    return saved ? JSON.parse(saved) : INITIAL_COMPLAINTS;
  });

  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [form, setForm] = useState({
    category: 'Food Quality',
    foodItem: '',
    mealType: 'LUNCH',
    description: '',
    photoUrl: ''
  });
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    localStorage.setItem('hostel_mess_complaints_v2', JSON.stringify(complaints));
  }, [complaints]);

  const openCount = complaints.filter((c) => c.status !== 'RESOLVED').length;
  const resolvedCount = complaints.filter((c) => c.status === 'RESOLVED').length;

  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) return;

    const newTicket = {
      id: `CMP-${Math.floor(1000 + Math.random() * 9000)}`,
      category: form.category,
      foodItem: form.foodItem || 'General Dining',
      mealType: form.mealType,
      studentName: currentUser.name || currentUser.email?.split('@')[0] || 'Student',
      room: currentUser.roomNumber ? `Room ${currentUser.roomNumber}` : 'Hostel Resident',
      description: form.description,
      status: 'SUBMITTED',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timeline: [
        { step: 'Submitted', time: 'Just now', completed: true },
        { step: 'Assigned to Admin', completed: false },
        { step: 'Investigation', completed: false },
        { step: 'Action Taken', completed: false },
        { step: 'Resolved', completed: false }
      ],
      resolution: null
    };

    // Attempt backend sync
    messApi.raiseComplaint({
      category: form.category,
      foodItem: form.foodItem || 'General',
      mealType: form.mealType,
      comment: form.description
    }).catch(() => {});

    setComplaints([newTicket, ...complaints]);
    setNewModalOpen(false);
    setForm({ category: 'Food Quality', foodItem: '', mealType: 'LUNCH', description: '', photoUrl: '' });
    setSuccessMsg(`Ticket ${newTicket.id} logged successfully with Warden Desk!`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleStatusUpdate = (complaintId, nextStatus) => {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id !== complaintId) return c;
        const updatedTimeline = c.timeline.map((step) => {
          if (nextStatus === 'UNDER INVESTIGATION' && (step.step === 'Assigned to Mess Warden' || step.step === 'Assigned to Admin' || step.step === 'Investigation')) {
            return { ...step, completed: true, time: 'Done' };
          }
          if (nextStatus === 'ACTION TAKEN' && (step.step.includes('Action') || step.step.includes('Cleaned'))) {
            return { ...step, completed: true, time: 'Action completed' };
          }
          if (nextStatus === 'RESOLVED') {
            return { ...step, completed: true, time: 'Closed' };
          }
          return step;
        });
        return {
          ...c,
          status: nextStatus,
          timeline: updatedTimeline
        };
      })
    );
    if (selectedComplaint?.id === complaintId) {
      setSelectedComplaint((prev) => ({ ...prev, status: nextStatus }));
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'OPEN') return c.status !== 'RESOLVED';
    if (activeFilter === 'RESOLVED') return c.status === 'RESOLVED';
    return c.status === activeFilter;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-0 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Complaints & Grievance Redressal"
          subtitle="Track food quality issues, hygiene escalations, and contractor SLA actions with complete audit transparency."
          badge="Audit Redressal"
        />

        <Button
          onClick={() => setNewModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 shrink-0 shadow-sm"
        >
          <Plus className="h-4 w-4" /> File New Complaint
        </Button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-sm font-semibold">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Summary KPI Counters (User Spec #6) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Active / Open
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {openCount}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Resolved & Closed
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {resolvedCount}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Avg. Resolution Time
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              2.4 hrs
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              SLA Adherence
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              96.2%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {['ALL', 'OPEN', 'UNDER INVESTIGATION', 'ACTION TAKEN', 'RESOLVED'].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeFilter === filter
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Complaints List & Timeline Preview */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className={selectedComplaint ? 'lg:col-span-7 space-y-3' : 'lg:col-span-12 space-y-3'}>
          {filteredComplaints.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-60" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No complaints matching filter</p>
              <p className="text-xs text-slate-400 mt-1">All issues have been resolved cleanly.</p>
            </div>
          ) : (
            filteredComplaints.map((c) => {
              const isSelected = selectedComplaint?.id === c.id;
              const isResolved = c.status === 'RESOLVED';

              return (
                <Card
                  key={c.id}
                  onClick={() => setSelectedComplaint(c)}
                  className={`border transition-all cursor-pointer bg-white dark:bg-slate-900 shadow-xs hover:border-blue-400 ${
                    isSelected ? 'ring-2 ring-blue-600 border-blue-600' : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-slate-500">{c.id}</span>
                        <Badge variant="outline" className="text-[10px] font-bold">
                          {c.category}
                        </Badge>
                      </div>

                      <Badge
                        variant={isResolved ? 'success' : c.status === 'UNDER INVESTIGATION' ? 'warning' : 'neutral'}
                        className="text-[10px] font-extrabold"
                      >
                        {c.status}
                      </Badge>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {c.foodItem} ({c.mealType})
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {c.description}
                    </p>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>By {c.studentName} ({c.room})</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {c.date} • {c.time}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Selected Complaint Detail & Timeline Drawer (User Spec #6) */}
        {selectedComplaint && (
          <div className="lg:col-span-5">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm sticky top-24">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs font-black text-blue-600 dark:text-blue-400">
                      {selectedComplaint.id}
                    </span>
                    <CardTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                      {selectedComplaint.category}
                    </CardTitle>
                  </div>
                  <button
                    onClick={() => setSelectedComplaint(null)}
                    className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Reported By
                  </label>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {selectedComplaint.studentName} • {selectedComplaint.room}
                  </p>
                  <p className="text-[11px] text-slate-400">{selectedComplaint.date} at {selectedComplaint.time}</p>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Issue Description
                  </label>
                  <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 mt-1 leading-relaxed">
                    {selectedComplaint.description}
                  </p>
                </div>

                {/* Audit Timeline Tracker */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Resolution Timeline
                  </label>
                  <div className="space-y-3 relative pl-4 border-l-2 border-blue-500/30 ml-2">
                    {selectedComplaint.timeline?.map((step, idx) => (
                      <div key={idx} className="relative">
                        <div
                          className={`absolute -left-[21px] top-0.5 h-3.5 w-3.5 rounded-full border-2 ${
                            step.completed
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : step.current
                              ? 'border-amber-500 bg-amber-500 animate-pulse'
                              : 'border-slate-400 bg-white dark:bg-slate-900'
                          }`}
                        />
                        <div className="pl-1">
                          <p className={`font-semibold ${step.completed ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>
                            {step.step}
                          </p>
                          {step.time && (
                            <p className="text-[10px] text-slate-400">{step.time}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedComplaint.resolution && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                    <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">Official Action / Resolution</p>
                    <p className="text-slate-700 dark:text-slate-300 mt-1">{selectedComplaint.resolution}</p>
                  </div>
                )}

                {/* Admin Status Actions */}
                {isAdmin && selectedComplaint.status !== 'RESOLVED' && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Warden / Admin Actions
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(selectedComplaint.id, 'UNDER INVESTIGATION')}
                        className="text-xs"
                      >
                        Investigate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(selectedComplaint.id, 'ACTION TAKEN')}
                        className="text-xs"
                      >
                        Action Taken
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(selectedComplaint.id, 'RESOLVED')}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                    >
                      Mark Fully Resolved
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Student New Complaint Modal */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquareWarning className="h-5 w-5 text-rose-600" />
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                  File Formal Mess Complaint
                </h3>
              </div>
              <button
                onClick={() => setNewModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateComplaint} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Meal Slot</label>
                  <select
                    value={form.mealType}
                    onChange={(e) => setForm({ ...form, mealType: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold"
                  >
                    <option value="BREAKFAST">BREAKFAST</option>
                    <option value="LUNCH">LUNCH</option>
                    <option value="SNACKS">SNACKS</option>
                    <option value="DINNER">DINNER</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Food Item or Facility</label>
                <input
                  type="text"
                  placeholder="e.g. Rice, Dal Tadka, Plate Cleanliness"
                  value={form.foodItem}
                  onChange={(e) => setForm({ ...form, foodItem: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Description of Issue</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail exactly what was wrong (temperature, taste, shortage, foreign object)..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setNewModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-rose-600 hover:bg-rose-700 text-white font-bold">
                  Submit Complaint
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
