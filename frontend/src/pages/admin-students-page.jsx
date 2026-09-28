import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  UserCheck,
  Building,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';

const SAMPLE_STUDENTS = [
  { id: 'ST-001', usn: '1MS23CS154', name: 'Rohith Gowda', email: 'rohith@university.edu', block: 'A', room: '304', bed: '2', status: 'ACTIVE', attendance: 87, mealsThisMonth: 64, complaints: 2 },
  { id: 'ST-002', usn: '1MS23CS002', name: 'Aarav Patel', email: 'aarav@university.edu', block: 'B', room: '201', bed: '1', status: 'ACTIVE', attendance: 92, mealsThisMonth: 68, complaints: 1 },
  { id: 'ST-003', usn: '1MS23EC045', name: 'Karan Sharma', email: 'karan@university.edu', block: 'A', room: '103', bed: '3', status: 'ACTIVE', attendance: 78, mealsThisMonth: 54, complaints: 0 },
  { id: 'ST-004', usn: '1MS23CS089', name: 'Sneha Rao', email: 'sneha@university.edu', block: 'A', room: '108', bed: '1', status: 'ACTIVE', attendance: 95, mealsThisMonth: 72, complaints: 1 },
  { id: 'ST-005', usn: '1MS23ME032', name: 'Vikram Singh', email: 'vikram@university.edu', block: 'C', room: '412', bed: '2', status: 'ACTIVE', attendance: 65, mealsThisMonth: 44, complaints: 3 },
  { id: 'ST-006', usn: '1MS23IS018', name: 'Ananya Deshmukh', email: 'ananya@university.edu', block: 'B', room: '305', bed: '1', status: 'ACTIVE', attendance: 89, mealsThisMonth: 66, complaints: 0 },
  { id: 'ST-007', usn: '1MS23EE012', name: 'Priya Iyer', email: 'priya@university.edu', block: 'A', room: '210', bed: '2', status: 'ACTIVE', attendance: 91, mealsThisMonth: 67, complaints: 0 },
];

export default function AdminStudentsPage() {
  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem('hostel_students_list');
    return saved ? JSON.parse(saved) : SAMPLE_STUDENTS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('ALL');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editModalStudent, setEditModalStudent] = useState(null);
  const [editBlock, setEditBlock] = useState('A');
  const [editRoom, setEditRoom] = useState('304');
  const [editBed, setEditBed] = useState('2');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    localStorage.setItem('hostel_students_list', JSON.stringify(students));
  }, [students]);

  const filteredStudents = students.filter((s) => {
    const matchesBlock = selectedBlock === 'ALL' || s.block === selectedBlock;
    const matchesSearch =
      !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.usn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.room.includes(searchQuery);
    return matchesBlock && matchesSearch;
  });

  const handleSaveAllocation = (e) => {
    e.preventDefault();
    if (!editModalStudent) return;

    setStudents((prev) =>
      prev.map((st) =>
        st.id === editModalStudent.id
          ? { ...st, block: editBlock, room: editRoom, bed: editBed }
          : st
      )
    );

    if (selectedStudent?.id === editModalStudent.id) {
      setSelectedStudent((prev) => ({
        ...prev,
        block: editBlock,
        room: editRoom,
        bed: editBed
      }));
    }

    setEditModalStudent(null);
    setSuccessMsg(`Room allocation updated for ${editModalStudent.name}!`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-0 duration-200">
      <PageHeader
        title="Hostel Residents & Room Allocation"
        subtitle="Manage student profiles, hostel block/room/bed allocations, and dining attendance rates."
        badge="Residents Management"
      />

      {successMsg && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-sm font-semibold">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by student name, USN, email, or room number..."
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

      {/* Main Student Table and Detail Split */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className={selectedStudent ? 'lg:col-span-8' : 'lg:col-span-12'}>
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5 pl-4">Student & USN</th>
                    <th className="p-3.5">Block</th>
                    <th className="p-3.5">Room</th>
                    <th className="p-3.5">Bed</th>
                    <th className="p-3.5">Turnout</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No students found matching search.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 pl-4">
                          <p className="font-bold text-slate-900 dark:text-slate-100">{st.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{st.usn} • {st.email}</p>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300">
                          Block {st.block}
                        </td>
                        <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300">
                          {st.room}
                        </td>
                        <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300">
                          Bed {st.bed}
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{st.attendance}%</span>
                        </td>
                        <td className="p-3.5">
                          <Badge variant="success" className="text-[10px] font-bold">
                            {st.status}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-right pr-4 space-x-1">
                          <Button
                            size="iconSm"
                            variant="ghost"
                            onClick={() => setSelectedStudent(st)}
                            title="View Student Dossier"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="iconSm"
                            variant="ghost"
                            onClick={() => {
                              setEditModalStudent(st);
                              setEditBlock(st.block);
                              setEditRoom(st.room);
                              setEditBed(st.bed);
                            }}
                            title="Edit Room Allocation"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-blue-600" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Student Detail Dossier Drawer (User Spec #18) */}
        {selectedStudent && (
          <div className="lg:col-span-4">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm sticky top-24">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    Student Dossier
                  </CardTitle>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    {selectedStudent.name}
                  </h3>
                  <p className="text-slate-400 font-mono mt-0.5">{selectedStudent.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">University USN</span>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedStudent.usn}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Hostel Block</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">Block {selectedStudent.block}</p>
                  </div>
                  <div className="mt-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Assigned Room</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedStudent.room}</p>
                  </div>
                  <div className="mt-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Bed Number</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">Bed {selectedStudent.bed}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-semibold">Meals Consumed this Month:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{selectedStudent.mealsThisMonth}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-semibold">Complaints Filed:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{selectedStudent.complaints}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-semibold">Turnout Rate:</span>
                    <span className="font-bold text-emerald-600">{selectedStudent.attendance}%</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditModalStudent(selectedStudent);
                      setEditBlock(selectedStudent.block);
                      setEditRoom(selectedStudent.room);
                      setEditBed(selectedStudent.bed);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  >
                    Edit Allocation Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Edit Allocation Modal */}
      {editModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                Edit Room Allocation: {editModalStudent.name}
              </h3>
              <button
                onClick={() => setEditModalStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAllocation} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Hostel Block</label>
                <select
                  value={editBlock}
                  onChange={(e) => setEditBlock(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold"
                >
                  <option value="A">Block A</option>
                  <option value="B">Block B</option>
                  <option value="C">Block C</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Room Number</label>
                  <input
                    type="text"
                    required
                    value={editRoom}
                    onChange={(e) => setEditRoom(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Bed Number</label>
                  <input
                    type="text"
                    required
                    value={editBed}
                    onChange={(e) => setEditBed(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditModalStudent(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                  Save Allocation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
