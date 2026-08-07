import { useEffect, useState } from 'react';
import { messApi } from '@/services/mess-api';
import { getUser } from '@/services/auth-service';

export default function DirectoryPage() {
  const [students, setStudents] = useState([]);
  const [occupancyStats, setOccupancyStats] = useState({ totalStudents: 0, occupiedRooms: 0, vacancies: 0 });
  const [search, setSearch] = useState('');
  const [filterHostel, setFilterHostel] = useState('');
  const [filterBlock, setFilterBlock] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newRoom, setNewRoom] = useState({ roomNumber: '', block: 'Freshers Block', capacity: 2 });
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
        });
      }

      const studentList = [];

      if (treeData && Array.isArray(treeData)) {
        for (const blockObj of treeData) {
          const blockName = blockObj.block || 'Freshers Block';
          if (blockObj.floors && Array.isArray(blockObj.floors)) {
            for (const floorObj of blockObj.floors) {
              if (floorObj.rooms && Array.isArray(floorObj.rooms)) {
                for (const room of floorObj.rooms) {
                  if (room.occupancy > 0 && room.id) {
                    try {
                      const roomDetails = await messApi.getRoomDetails(room.id).catch(() => null);
                      if (roomDetails && roomDetails.occupants && Array.isArray(roomDetails.occupants)) {
                        for (const st of roomDetails.occupants) {
                          let hName = 'Freshers Block';
                          if (blockName.includes('Aryabhatta')) hName = 'Aryabhatta Hostel';
                          else if (blockName.includes('NNRI')) hName = 'NNRI Hostel';
                          else if (blockName.includes('PG')) hName = 'PG Hostel';

                          studentList.push({
                            id: st.id || st.email,
                            name: st.name || st.email?.split('@')[0] || 'Student',
                            studentId: st.email || st.id,
                            hostel: hName,
                            block: blockName,
                            room: room.roomNumber || 'FR101',
                            branch: st.branch || 'Computer Science',
                            year: st.year || '1',
                            roomType: blockName.includes('NNRI') ? 'Single Sharing (Attached)' : 'Two Sharing (Common)',
                            status: 'present',
                            initials: (st.name || st.email || 'ST')
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2),
                          });
                        }
                      }
                    } catch (err) {}
                  }
                }
              }
            }
          }
        }
      }

      if (studentList.length === 0) {
        const adminStudents = await messApi.getAdminStudents('').catch(() => []);
        if (Array.isArray(adminStudents) && adminStudents.length > 0) {
          adminStudents.forEach((st) => {
            let hName = 'Freshers Block';
            const b = st.hostel || 'Freshers Block';
            if (b.includes('Aryabhatta')) hName = 'Aryabhatta Hostel';
            else if (b.includes('NNRI')) hName = 'NNRI Hostel';
            else if (b.includes('PG')) hName = 'PG Hostel';

            studentList.push({
              id: st.id || st.email,
              name: st.email?.split('@')[0] || 'Student',
              studentId: st.email,
              hostel: hName,
              block: b,
              room: st.roomNumber || 'FR101',
              branch: st.branch || 'Computer Science',
              year: st.year || '1',
              roomType: b.includes('NNRI') ? 'Single Sharing (Attached)' : 'Two Sharing (Common)',
              status: 'present',
              initials: (st.email || 'ST').slice(0, 2).toUpperCase(),
            });
          });
        }
      }

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
      const rows = students.map((s) => `"${s.name}","${s.studentId}","${s.hostel}","${s.block}","${s.room}","${s.branch}","${s.year}"`).join('\n');
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
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error('Error adding room:', err);
    }
  };

  const filtered = students.filter((s) => {
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase());
    const matchHostel = !filterHostel || s.hostel === filterHostel;
    const matchBlock = !filterBlock || s.block === filterBlock;
    const matchYear = !filterYear || String(s.year) === String(filterYear);
    const matchBranch = !filterBranch || s.branch.toLowerCase().includes(filterBranch.toLowerCase());
    return matchSearch && matchHostel && matchBlock && matchYear && matchBranch;
  });

  return (
    <div className="flex-1 overflow-y-auto font-[Inter,sans-serif]">
      <main className="p-4 md:p-6 mt-4 md:mt-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-[36px] font-semibold leading-10 text-[#191c1d] md:text-[45px]">Hostel Directory</h1>
            <p className="text-sm text-[#424752] mt-1">Ramaiah Hostel Complex - Student & Room Allocation Directory</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 border border-[#003f87] text-[#003f87] rounded-lg text-sm font-medium hover:bg-[#f3f4f5] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export CSV
            </button>
            {isAdmin && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#003f87] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Add Room
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-[#c2c6d4] rounded-xl p-5 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-[#424752] mb-2">
              <span className="material-symbols-outlined text-[20px]">groups</span>
              <span className="text-sm font-medium">Total Students</span>
            </div>
            <div className="text-[45px] font-semibold text-[#191c1d] leading-none">
              {occupancyStats.totalStudents || students.length}
            </div>
          </div>
          <div className="bg-white border border-[#c2c6d4] rounded-xl p-5 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-[#424752] mb-2">
              <span className="material-symbols-outlined text-[20px]">meeting_room</span>
              <span className="text-sm font-medium">Occupied Rooms</span>
            </div>
            <div className="text-[45px] font-semibold text-[#191c1d] leading-none">
              {occupancyStats.occupiedRooms}
            </div>
          </div>
          <div className="bg-[#e8f5ea] text-[#191c1d] rounded-xl p-5 flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2 z-10 relative">
              <span className="material-symbols-outlined text-[20px]">door_open</span>
              <span className="text-sm font-medium">Vacancies</span>
            </div>
            <div className="text-[45px] font-semibold leading-none z-10 relative">
              {occupancyStats.vacancies}
            </div>
            <span className="material-symbols-outlined absolute right-[-20px] bottom-[-20px] text-[100px] opacity-10" style={{ fontVariationSettings: "'FILL' 1" }}>
              door_open
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white border border-[#c2c6d4] rounded-xl p-4 flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#424752]">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student name or ID..."
              className="w-full pl-10 pr-4 py-2 bg-[#f3f4f5] border-b border-[#c2c6d4] focus:border-[#003f87] focus:border-b-2 rounded-t-md transition-colors outline-none text-sm text-[#191c1d]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Hostel Filter */}
            <select
              value={filterHostel}
              onChange={(e) => {
                setFilterHostel(e.target.value);
                setFilterBlock('');
              }}
              className="px-4 py-2 bg-[#f3f4f5] border-b border-[#c2c6d4] focus:border-[#003f87] focus:border-b-2 rounded-t-md outline-none text-sm text-[#191c1d] cursor-pointer"
            >
              <option value="">All Hostels</option>
              <option value="Freshers Block">Freshers Block</option>
              <option value="Aryabhatta Hostel">Aryabhatta Hostel</option>
              <option value="NNRI Hostel">NNRI Hostel</option>
              <option value="PG Hostel">PG Hostel</option>
            </select>

            {/* Block Filter */}
            <select
              value={filterBlock}
              onChange={(e) => setFilterBlock(e.target.value)}
              className="px-4 py-2 bg-[#f3f4f5] border-b border-[#c2c6d4] focus:border-[#003f87] focus:border-b-2 rounded-t-md outline-none text-sm text-[#191c1d] cursor-pointer"
            >
              <option value="">All Blocks</option>
              {(!filterHostel || filterHostel === 'Freshers Block') && <option value="Freshers Block">Freshers Block</option>}
              {(!filterHostel || filterHostel === 'Aryabhatta Hostel') && (
                <>
                  <option value="Aryabhatta G">Aryabhatta G Block</option>
                  <option value="Aryabhatta F">Aryabhatta F Block</option>
                  <option value="Aryabhatta S">Aryabhatta S Block</option>
                </>
              )}
              {(!filterHostel || filterHostel === 'NNRI Hostel') && <option value="NNRI Hostel">NNRI Hostel</option>}
              {(!filterHostel || filterHostel === 'PG Hostel') && <option value="PG Hostel">PG Hostel</option>}
            </select>

            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-4 py-2 bg-[#f3f4f5] border-b border-[#c2c6d4] focus:border-[#003f87] focus:border-b-2 rounded-t-md outline-none text-sm text-[#191c1d] cursor-pointer"
            >
              <option value="">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="px-4 py-2 bg-[#f3f4f5] border-b border-[#c2c6d4] focus:border-[#003f87] focus:border-b-2 rounded-t-md outline-none text-sm text-[#191c1d] cursor-pointer"
            >
              <option value="">All Branches</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Electrical">Electrical</option>
              <option value="Electronics">Electronics</option>
              <option value="Civil">Civil</option>
            </select>
          </div>
        </div>

        {/* Directory Grid */}
        {loading ? (
          <div className="py-24 text-center text-sm text-[#424752]">Loading hostel directory...</div>
        ) : filtered.length === 0 ? (
          <div className="py-24 flex flex-col items-center gap-3 text-[#424752]">
            <span className="material-symbols-outlined text-[48px] opacity-40">person_search</span>
            <p className="text-sm font-medium">No students found in directory</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((student) => (
              <div key={student.id} className="bg-white border border-[#c2c6d4] rounded-xl p-4 hover:shadow-[0px_4px_12px_rgba(0,0,0,0.05)] transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-full border border-[#c2c6d4] flex items-center justify-center text-sm font-bold bg-[#003f87] text-white">
                    {student.initials}
                  </div>
                  <span className="px-2 py-1 rounded-full text-[11px] font-medium flex items-center gap-1 bg-[#006e25]/10 text-[#006e25]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#006e25]" /> Present
                  </span>
                </div>
                <h3 className="text-[22px] font-medium text-[#191c1d] truncate leading-7">{student.name}</h3>
                <p className="text-sm text-[#424752] mb-3">{student.studentId}</p>
                <div className="flex items-center gap-2 text-sm text-[#191c1d]">
                  <span className="material-symbols-outlined text-[16px] text-[#424752]">location_on</span>
                  {student.block} • Room {student.room}
                </div>
                <div className="text-[11px] text-[#424752] mt-1 font-medium">
                  {student.roomType}
                </div>
                {student.branch && (
                  <div className="flex items-center gap-2 text-sm text-[#424752] mt-2">
                    <span className="material-symbols-outlined text-[16px]">school</span>
                    {student.branch} ({student.year} Yr)
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Room Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[22px] font-semibold text-[#191c1d]">Add Hostel Room</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-[#424752] hover:bg-[#e1e3e4] rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddRoomSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#191c1d] mb-1">Hostel Block</label>
                <select
                  value={newRoom.block}
                  onChange={(e) => setNewRoom({ ...newRoom, block: e.target.value })}
                  className="w-full bg-[#f3f4f5] border-b-2 border-[#c2c6d4] focus:border-[#003f87] rounded-t-md px-4 py-2 outline-none text-sm text-[#191c1d]"
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
                <label className="block text-sm font-medium text-[#191c1d] mb-1">Room Number</label>
                <input
                  type="text"
                  required
                  value={newRoom.roomNumber}
                  onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                  placeholder="e.g. G101 / F102 / FR105"
                  className="w-full bg-[#f3f4f5] border-b-2 border-[#c2c6d4] focus:border-[#003f87] rounded-t-md px-4 py-2 outline-none text-sm text-[#191c1d]"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-[#c2c6d4] text-[#191c1d] rounded-lg text-sm font-medium hover:bg-[#f3f4f5]">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-[#003f87] text-white rounded-lg text-sm font-medium hover:opacity-90">
                  Save Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
