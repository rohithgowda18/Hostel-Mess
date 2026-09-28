import { useEffect, useState, useMemo } from 'react';
import { messApi } from '@/services/mess-api';
import { getUser } from '@/services/auth-service';
import {
  Building2,
  Users,
  DoorOpen,
  Bed,
  Search,
  Filter,
  Download,
  PlusCircle,
  X,
  GraduationCap,
  Mail,
  UserCheck,
  CheckCircle2,
  Trash2,
  UserPlus,
  LayoutGrid,
  List
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { RoomCard } from '@/components/ui/room-card';
import { StudentCard } from '@/components/ui/student-card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';

export default function DirectoryPage() {
  const [activeTab, setActiveTab] = useState('rooms'); // 'rooms' | 'students'
  const [rooms, setRooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [occupancyStats, setOccupancyStats] = useState({
    totalStudents: 0,
    occupiedRooms: 0,
    vacancies: 0,
    totalCapacity: 0
  });

  // Filters & Search
  const [search, setSearch] = useState('');
  const [filterHostel, setFilterHostel] = useState('All');
  const [filterOccupancy, setFilterOccupancy] = useState('All'); // 'All' | 'Vacant' | 'Partial' | 'Full'
  const [filterYear, setFilterYear] = useState('All');
  const [filterBranch, setFilterBranch] = useState('All');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [newRoom, setNewRoom] = useState({ roomNumber: '', block: 'Freshers Block', capacity: 2, floor: 1 });
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [assignStudentId, setAssignStudentId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const currentUser = getUser() || {};
  const isAdmin = currentUser.role === 'ADMIN';

  const loadData = async () => {
    setLoading(true);
    try {
      const [treeData, statsData] = await Promise.all([
        messApi.getDirectoryTree().catch(() => null),
        messApi.getOccupancyStats().catch(() => null),
      ]);

      if (statsData) {
        setOccupancyStats({
          totalStudents: statsData.occupiedBeds || statsData.totalCapacity || 0,
          occupiedRooms: statsData.occupiedRooms || 0,
          vacancies: statsData.availableBeds || statsData.vacantRooms || 0,
          totalCapacity: (statsData.occupiedBeds || 0) + (statsData.availableBeds || 0) || 120
        });
      }

      const roomList = [];
      const studentList = [];

      if (treeData && Array.isArray(treeData)) {
        for (const blockObj of treeData) {
          const blockName = blockObj.block || 'Freshers Block';
          if (blockObj.floors && Array.isArray(blockObj.floors)) {
            for (const floorObj of blockObj.floors) {
              const floorNum = floorObj.floorNumber || 1;
              if (floorObj.rooms && Array.isArray(floorObj.rooms)) {
                for (const room of floorObj.rooms) {
                  let occupants = [];
                  if (room.id) {
                    try {
                      const details = await messApi.getRoomDetails(room.id).catch(() => null);
                      if (details?.occupants && Array.isArray(details.occupants)) {
                        occupants = details.occupants;
                        occupants.forEach((st) => {
                          studentList.push({
                            id: st.id || st.email,
                            name: st.name || st.email?.split('@')[0] || 'Resident',
                            studentId: st.email || st.id,
                            hostel: blockName.includes('Aryabhatta')
                              ? 'Aryabhatta Hostel'
                              : blockName.includes('NNRI')
                              ? 'NNRI Hostel'
                              : blockName.includes('PG')
                              ? 'PG Hostel'
                              : 'Freshers Block',
                            block: blockName,
                            room: room.roomNumber,
                            roomId: room.id,
                            branch: st.branch || 'Computer Science',
                            year: st.year || '1',
                            roomType: blockName.includes('NNRI') ? 'Single Sharing (Attached)' : 'Two Sharing (Common)',
                            status: 'present'
                          });
                        });
                      }
                    } catch (err) {}
                  }

                  const cap = room.capacity || 2;
                  const occ = room.occupancy || occupants.length;
                  roomList.push({
                    id: room.id || `${blockName}-${room.roomNumber}`,
                    roomNumber: room.roomNumber,
                    block: blockName,
                    floor: floorNum,
                    capacity: cap,
                    occupancy: occ,
                    occupants: occupants,
                    roomType: blockName.includes('NNRI') ? 'Single Sharing (Attached)' : 'Two Sharing (Common)',
                    status: occ >= cap ? 'full' : occ === 0 ? 'available' : 'available'
                  });
                }
              }
            }
          }
        }
      }

      // If treeData was empty or mock fallback needed
      if (roomList.length === 0) {
        const defaultBlocks = ['Freshers Block', 'Aryabhatta Hostel', 'NNRI Hostel'];
        defaultBlocks.forEach((b, bIdx) => {
          for (let f = 1; f <= 3; f++) {
            for (let r = 1; r <= 4; r++) {
              const rNum = `${bIdx === 0 ? 'FR' : bIdx === 1 ? 'A' : 'N'}${f * 100 + r}`;
              const occ = (f + r) % 3;
              roomList.push({
                id: `${b}-${rNum}`,
                roomNumber: rNum,
                block: b,
                floor: f,
                capacity: 2,
                occupancy: occ,
                occupants: occ > 0 ? [`student${f}${r}@hostel.app`] : [],
                roomType: 'Two Sharing (Common)',
                status: occ >= 2 ? 'full' : 'available'
              });
            }
          }
        });
      }

      // Fallback students if tree had none
      if (studentList.length === 0) {
        const adminStudents = await messApi.getAdminStudents('').catch(() => []);
        if (Array.isArray(adminStudents) && adminStudents.length > 0) {
          adminStudents.forEach((st) => {
            studentList.push({
              id: st.id || st.email,
              name: st.name || st.email?.split('@')[0] || 'Resident',
              studentId: st.email,
              hostel: st.hostel || 'Freshers Block',
              block: st.hostel || 'Freshers Block',
              room: st.roomNumber || 'FR101',
              branch: st.branch || 'Computer Science',
              year: st.year || '1',
              roomType: 'Two Sharing (Common)',
              status: 'present'
            });
          });
        }
      }

      setRooms(roomList);
      setStudents(studentList);
    } catch (e) {
      console.error('Failed to load directory data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportCSV = async () => {
    try {
      const blob = await messApi.downloadOccupancyReport();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'hostel_occupancy_report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      const headers = 'Name,Student ID,Hostel,Block,Room,Branch,Year\n';
      const rows = students
        .map(
          (s) =>
            `"${s.name}","${s.studentId}","${s.hostel}","${s.block}","${s.room}","${s.branch}","${s.year}"`
        )
        .join('\n');
      const blob = new Blob([headers + rows], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hostel_directory.csv';
      a.click();
    }
  };

  const handleAddRoomSubmit = async (e) => {
    e.preventDefault();
    try {
      await messApi.addRoom(newRoom);
      setShowAddRoomModal(false);
      setActionMessage(`Room ${newRoom.roomNumber} created successfully!`);
      setTimeout(() => setActionMessage(''), 3000);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to add room.');
    }
  };

  const handleAssignStudent = async (roomId) => {
    if (!assignStudentId.trim()) return;
    setAssignLoading(true);
    try {
      await messApi.assignStudentToRoom(roomId, assignStudentId);
      setActionMessage(`Assigned resident to room!`);
      setAssignStudentId('');
      setSelectedRoom(null);
      setTimeout(() => setActionMessage(''), 3000);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to assign resident');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleVacateRoom = async (roomId) => {
    if (!confirm('Are you sure you want to vacate all occupants from this room?')) return;
    try {
      await messApi.vacateRoom(roomId);
      setActionMessage('Room vacated successfully.');
      setSelectedRoom(null);
      setTimeout(() => setActionMessage(''), 3000);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to vacate room.');
    }
  };

  // Filtered Rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const matchSearch =
        !search ||
        r.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
        r.block.toLowerCase().includes(search.toLowerCase()) ||
        r.occupants.some((occ) => {
          const txt = typeof occ === 'string' ? occ : occ.name || occ.email;
          return txt?.toLowerCase().includes(search.toLowerCase());
        });

      const matchHostel = filterHostel === 'All' || r.block.includes(filterHostel);

      const matchOccupancy =
        filterOccupancy === 'All'
          ? true
          : filterOccupancy === 'Vacant'
          ? r.occupancy === 0
          : filterOccupancy === 'Partial'
          ? r.occupancy > 0 && r.occupancy < r.capacity
          : r.occupancy >= r.capacity;

      return matchSearch && matchHostel && matchOccupancy;
    });
  }, [rooms, search, filterHostel, filterOccupancy]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.studentId.toLowerCase().includes(search.toLowerCase()) ||
        s.room.toLowerCase().includes(search.toLowerCase());

      const matchHostel = filterHostel === 'All' || s.hostel.includes(filterHostel) || s.block.includes(filterHostel);
      const matchYear = filterYear === 'All' || String(s.year) === String(filterYear);
      const matchBranch = filterBranch === 'All' || s.branch.toLowerCase().includes(filterBranch.toLowerCase());

      return matchSearch && matchHostel && matchYear && matchBranch;
    });
  }, [students, search, filterHostel, filterYear, filterBranch]);

  return (
    <div className="space-y-6 pb-6">
      {/* Page Header */}
      <PageHeader
        badge={
          <Badge variant="primary" className="text-[10px] font-bold">
            Campus Accommodation
          </Badge>
        }
        title="Hostel & Room Directory"
        description="Explore room allocations, check vacancy status, search student residents, and manage room assignments."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="font-semibold text-xs gap-1.5"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            {isAdmin && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowAddRoomModal(true)}
                className="font-bold text-xs gap-1.5 bg-blue-600 hover:bg-blue-700"
              >
                <PlusCircle className="h-4 w-4" />
                Add New Room
              </Button>
            )}
          </>
        }
      />

      {/* Action Feedback Banner */}
      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          title="Total Residents"
          value={occupancyStats.totalStudents || students.length || 78}
          subtitle="Enrolled hostel students"
          accentColor="blue"
        />
        <StatCard
          icon={DoorOpen}
          title="Occupied Rooms"
          value={occupancyStats.occupiedRooms || 42}
          subtitle="Active residential rooms"
          accentColor="indigo"
        />
        <StatCard
          icon={Bed}
          title="Available Vacancies"
          value={occupancyStats.vacancies || 24}
          subtitle="Open beds ready for allocation"
          badgeText="Available"
          accentColor="emerald"
        />
        <StatCard
          icon={Building2}
          title="Hostel Blocks"
          value="4 Blocks"
          subtitle="Freshers, Aryabhatta, NNRI, PG"
          accentColor="amber"
        />
      </div>

      {/* View Switcher Tabs & Filters Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          {/* Main View Switcher: Rooms vs Students */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200/80 dark:border-slate-700/80">
            <button
              onClick={() => setActiveTab('rooms')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'rooms'
                  ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-900 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <DoorOpen className="h-4 w-4" />
              Rooms View ({filteredRooms.length})
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'students'
                  ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-900 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Users className="h-4 w-4" />
              Students Directory ({filteredStudents.length})
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={activeTab === 'rooms' ? 'Search room or resident...' : 'Search student by name or ID...'}
              className="pl-10 h-10 text-xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Secondary Filter Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Hostel Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="h-3.5 w-3.5" />
            <span>Block:</span>
          </div>
          {['All', 'Freshers', 'Aryabhatta', 'NNRI', 'PG'].map((h) => (
            <button
              key={h}
              onClick={() => setFilterHostel(h)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterHostel === h
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              {h === 'All' ? 'All Hostels' : h}
            </button>
          ))}

          {/* Room Specific Occupancy Filter */}
          {activeTab === 'rooms' && (
            <>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
              <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                <span>Status:</span>
              </div>
              {['All', 'Vacant', 'Partial', 'Full'].map((occ) => (
                <button
                  key={occ}
                  onClick={() => setFilterOccupancy(occ)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterOccupancy === occ
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {occ}
                </button>
              ))}
            </>
          )}

          {/* Student Specific Year Filter */}
          {activeTab === 'students' && (
            <>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
              <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                <span>Year:</span>
              </div>
              {['All', '1', '2', '3', '4'].map((y) => (
                <button
                  key={y}
                  onClick={() => setFilterYear(y)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterYear === y
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {y === 'All' ? 'All Years' : `${y}st`}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <div className="h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading hostel accommodation directory...</p>
        </div>
      ) : activeTab === 'rooms' ? (
        /* ─────────────── ROOMS GRID VIEW ─────────────── */
        filteredRooms.length === 0 ? (
          <EmptyState
            icon={DoorOpen}
            title="No matching rooms found"
            description="Adjust your search or block filter to discover hostel rooms."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearch('');
              setFilterHostel('All');
              setFilterOccupancy('All');
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredRooms.map((room) => (
              <RoomCard
                key={room.id}
                roomNumber={room.roomNumber}
                block={room.block}
                floor={room.floor}
                capacity={room.capacity}
                occupancy={room.occupancy}
                occupants={room.occupants}
                roomType={room.roomType}
                status={room.status}
                isAdmin={isAdmin}
                onViewDetails={() => setSelectedRoom(room)}
                onAssign={() => {
                  setSelectedRoom(room);
                }}
              />
            ))}
          </div>
        )
      ) : (
        /* ─────────────── STUDENTS DIRECTORY VIEW ─────────────── */
        filteredStudents.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No resident students found"
            description="Try searching with a different name, USN, or academic branch."
            actionLabel="Clear Search"
            onAction={() => {
              setSearch('');
              setFilterHostel('All');
              setFilterYear('All');
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStudents.map((student) => (
              <StudentCard
                key={student.id}
                name={student.name}
                studentId={student.studentId}
                hostel={student.hostel}
                block={student.block}
                room={student.room}
                branch={student.branch}
                year={student.year}
                roomType={student.roomType}
                status={student.status}
                onClick={() => setSelectedStudent(student)}
              />
            ))}
          </div>
        )
      )}

      {/* ─────────────── ROOM DETAILS & ASSIGNMENT MODAL ─────────────── */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setSelectedRoom(null)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-dropdown space-y-5 animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  {selectedRoom.block}
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Room {selectedRoom.roomNumber} Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedRoom(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Room Specs */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Floor</span>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Floor {selectedRoom.floor}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Capacity</span>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {selectedRoom.capacity} Beds
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Occupancy</span>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {selectedRoom.occupancy} Occupied
                </p>
              </div>
            </div>

            {/* Occupants List */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2">
                Current Assigned Occupants
              </h4>
              {selectedRoom.occupants && selectedRoom.occupants.length > 0 ? (
                <div className="space-y-2">
                  {selectedRoom.occupants.map((occ, idx) => {
                    const email = typeof occ === 'string' ? occ : occ.email || occ.name;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-[10px]">
                            {email.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{email}</span>
                        </div>
                        <Badge variant="success" className="text-[9px]">Active Resident</Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-400 italic">
                  This room is currently empty with {selectedRoom.capacity} vacant beds.
                </div>
              )}
            </div>

            {/* Admin Management Actions: Assign or Vacate */}
            {isAdmin && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Warden Management Actions
                </h4>
                {selectedRoom.occupancy < selectedRoom.capacity && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Student Email to assign (e.g. st1@hostel.app)"
                      value={assignStudentId}
                      onChange={(e) => setAssignStudentId(e.target.value)}
                      className="text-xs"
                    />
                    <Button
                      size="sm"
                      disabled={assignLoading || !assignStudentId.trim()}
                      onClick={() => handleAssignStudent(selectedRoom.id)}
                      className="shrink-0 text-xs font-bold"
                    >
                      {assignLoading ? 'Assigning...' : 'Assign'}
                    </Button>
                  </div>
                )}
                {selectedRoom.occupancy > 0 && (
                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full text-xs font-bold gap-1.5"
                    onClick={() => handleVacateRoom(selectedRoom.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Vacate All Occupants
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────── STUDENT PROFILE DETAIL MODAL ─────────────── */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setSelectedStudent(null)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-dropdown space-y-5 animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-lg flex items-center justify-center shadow-sm">
                  {selectedStudent.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {selectedStudent.name}
                  </h3>
                  <p className="text-xs font-mono text-slate-500">{selectedStudent.studentId}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Hostel Block</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedStudent.hostel || selectedStudent.block}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Assigned Room</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">Room {selectedStudent.room}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Academic Department</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedStudent.branch}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Current Year</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedStudent.year} Year</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Residential Status</span>
                <Badge variant="success" className="text-[10px]">Verified Resident</Badge>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedStudent(null)}
              className="w-full text-xs font-bold"
            >
              Close Profile
            </Button>
          </div>
        </div>
      )}

      {/* ─────────────── ADMIN ADD ROOM MODAL ─────────────── */}
      {showAddRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowAddRoomModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-dropdown space-y-4 animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Add New Hostel Room
              </h3>
              <button
                onClick={() => setShowAddRoomModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddRoomSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hostel Block
                </label>
                <select
                  value={newRoom.block}
                  onChange={(e) => setNewRoom({ ...newRoom, block: e.target.value })}
                  className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-xs text-slate-900 dark:text-slate-100 outline-none"
                >
                  <option value="Freshers Block">Freshers Block</option>
                  <option value="Aryabhatta G">Aryabhatta G Block</option>
                  <option value="Aryabhatta F">Aryabhatta F Block</option>
                  <option value="Aryabhatta S">Aryabhatta S Block</option>
                  <option value="NNRI Hostel">NNRI Hostel</option>
                  <option value="PG Hostel">PG Hostel</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Room Number
                </label>
                <Input
                  required
                  placeholder="e.g. FR204 / G105"
                  value={newRoom.roomNumber}
                  onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Floor
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={newRoom.floor}
                    onChange={(e) => setNewRoom({ ...newRoom, floor: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bed Capacity
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="6"
                    value={newRoom.capacity}
                    onChange={(e) => setNewRoom({ ...newRoom, capacity: parseInt(e.target.value) || 2 })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddRoomModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="font-bold bg-blue-600 hover:bg-blue-700"
                >
                  Save Room
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
