import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { messApi } from '@/services/mess-api';

const TABS = [
  { id: 'today', label: "Today's Meals", icon: 'today' },
  { id: 'weekly', label: 'Weekly Menu', icon: 'calendar_view_week' },
  { id: 'history', label: 'Meal History', icon: 'history' },
];

export default function MealsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('today');
  const [todayMeals, setTodayMeals] = useState([]);
  const [weeklyMenu, setWeeklyMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [consensusData, setConsensusData] = useState({});

  const getMondayDateStr = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
  };

  const fetchMealsData = async () => {
    setLoading(true);
    setError('');
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const slots = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];
      const [mealMap, ...consensusResults] = await Promise.all([
        messApi.getAllTodayMeals(slots).catch(() => ({})),
        ...slots.map((s) => messApi.getMealConsensus(s, todayStr).catch(() => null))
      ]);
      
      const consensusMap = {};
      slots.forEach((s, idx) => {
        consensusMap[s] = consensusResults[idx];
      });
      setConsensusData(consensusMap);

      const parsedToday = slots.map((slot) => {
        const mealObj = mealMap[slot];
        const cData = consensusMap[slot];
        return {
          rawSlot: slot,
          type: slot.charAt(0) + slot.slice(1).toLowerCase(),
          icon: slot === 'BREAKFAST' ? 'wb_twilight' : slot === 'LUNCH' ? 'light_mode' : slot === 'SNACKS' ? 'coffee' : 'nightlight',
          time: slot === 'BREAKFAST' ? '07:30 AM - 09:30 AM' : slot === 'LUNCH' ? '12:00 PM - 02:15 PM' : slot === 'SNACKS' ? '04:30 PM - 05:30 PM' : '07:30 PM - 09:30 PM',
          verified: (cData?.totalReporters || 0) >= 3 || mealObj?.status === 'VERIFIED',
          items: (mealObj?.items || []).map((name) => ({ name })),
          consensus: cData
        };
      });
      setTodayMeals(parsedToday);

      const mondayStr = getMondayDateStr();
      const weeklyRes = await messApi.getWeeklyMenu(mondayStr).catch(() => null);
      if (weeklyRes && (weeklyRes.monday || weeklyRes.tuesday)) {
        const daysMap = [
          { day: 'Monday', data: weeklyRes.monday },
          { day: 'Tuesday', data: weeklyRes.tuesday },
          { day: 'Wednesday', data: weeklyRes.wednesday },
          { day: 'Thursday', data: weeklyRes.thursday },
          { day: 'Friday', data: weeklyRes.friday },
          { day: 'Saturday', data: weeklyRes.saturday },
          { day: 'Sunday', data: weeklyRes.sunday },
        ];
        const parsedWeekly = daysMap.map(({ day, data }) => ({
          day,
          breakfast: data?.BREAKFAST ? data.BREAKFAST.join(', ') : '-',
          lunch: data?.LUNCH ? data.LUNCH.join(', ') : '-',
          snacks: data?.SNACKS ? data.SNACKS.join(', ') : '-',
          dinner: data?.DINNER ? data.DINNER.join(', ') : '-',
        }));
        setWeeklyMenu(parsedWeekly);
      } else {
        setWeeklyMenu([]);
      }
    } catch (e) {
      console.error('Error loading meals data:', e);
      setError('Failed to load menu data from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMealsData();
  }, []);

  const handleOpenReportModal = (slot) => {
    setReportModalSlot(slot);
    setSelectedItems([]);
    setPhotoUrl('');
    setReportSuccess('');
  };

  const handleToggleItem = (item) => {
    setSelectedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleSubmitConsensus = async (e) => {
    e.preventDefault();
    if (!reportModalSlot || selectedItems.length === 0) return;
    setReporting(true);
    setReportSuccess('');
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await messApi.submitMealConsensus(reportModalSlot, todayStr, selectedItems, photoUrl);
      setReportSuccess(res.message || 'Report submitted successfully!');
      setTimeout(() => {
        setReportModalSlot(null);
        fetchMealsData();
      }, 1500);
    } catch (err) {
      console.error(err);
      setReportSuccess('Failed to submit report.');
    } finally {
      setReporting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto font-[Inter,sans-serif] pb-24 md:pb-8">
      <main className="p-4 md:p-6">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-[36px] md:text-[45px] font-semibold text-[#191c1d] leading-10 md:leading-[52px]">Meals & Live Consensus</h1>
            <p className="text-sm text-[#424752] mt-1">Expected mess menu vs. real-time student consensus reports & confidence ratings.</p>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-[#f3f4f5] rounded-xl p-1 flex gap-1 mb-6 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-max flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white shadow-sm text-[#003f87]'
                  : 'text-[#424752] hover:text-[#191c1d]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading / Error States */}
        {loading && <div className="py-16 text-center text-sm text-[#424752]">Loading menu schedule & live consensus...</div>}
        {error && <div className="py-8 text-center text-sm text-[#ba1a1a]">{error}</div>}

        {/* Tab 1: Today's Meals with 3-State Consensus */}
        {!loading && !error && activeTab === 'today' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {todayMeals.map((meal) => {
              const cData = meal.consensus || {};
              const consensusItems = cData.items || [];
              const totalReporters = cData.totalReporters || 0;
              const agreement = cData.agreementPercentage || 0;
              const photos = cData.photos || [];

              return (
                <div key={meal.type} className="bg-white border border-[#c2c6d4] rounded-xl p-6 hover:shadow-[0px_4px_12px_rgba(0,0,0,0.05)] transition-shadow duration-300 relative overflow-hidden group">
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#cfe2ff] text-[#003f87] flex items-center justify-center">
                        <span className="material-symbols-outlined">{meal.icon}</span>
                      </div>
                      <div>
                        <h3 className="text-[22px] font-medium text-[#191c1d]">{meal.type}</h3>
                        <p className="text-[11px] font-medium text-[#424752]">{meal.time}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {meal.verified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#006e25] text-white text-[11px] font-medium">
                          <span className="material-symbols-outlined text-[14px]">check_circle</span> Verified ({agreement}%)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#f3f4f5] text-[#424752] text-[11px] font-medium border border-[#c2c6d4]">
                          <span className="material-symbols-outlined text-[14px]">hour_glass_empty</span> Unverified
                        </span>
                      )}
                      <button
                        onClick={() => navigate('/report-meal?slot=' + meal.rawSlot)}
                        className="px-3 py-1 bg-[#003f87] text-white text-[11px] font-semibold rounded-full hover:opacity-90 active:scale-95 transition-all flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">edit_note</span>
                        Report Serving
                      </button>
                    </div>
                  </div>

                  {/* 🟢 Live Student Consensus Reports */}
                  <div className="mb-4 p-3 bg-[#e8f5ea] border border-[#006e25]/20 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-[#006e25] uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">groups</span>
                        Live Consensus ({totalReporters} Reports)
                      </span>
                      {agreement > 0 && (
                        <span className="text-[11px] font-semibold text-[#006e25]">
                          {agreement}% Agreement
                        </span>
                      )}
                    </div>
                    {consensusItems.length === 0 ? (
                      <p className="text-xs text-[#424752] italic">No student reports yet. Be the first to report!</p>
                    ) : (
                      <div className="space-y-1.5">
                        {consensusItems.map((cItem, i) => (
                          <div key={i} className="flex justify-between items-center text-xs">
                            <span className="font-medium text-[#191c1d] flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#006e25]" />
                              {cItem.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-[#c2c6d4]/40 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-[#006e25] h-full rounded-full" style={{ width: `${cItem.confidence}%` }} />
                              </div>
                              <span className="font-semibold text-[#006e25] w-9 text-right">{cItem.confidence}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 🟡 Expected Menu */}
                  <div className="mb-4 space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#424752]">Published Menu</p>
                    {meal.items.length === 0 ? (
                      <p className="text-sm text-[#424752] italic">No published menu items.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {meal.items.map((item, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-[#f3f4f5] text-[#191c1d] rounded-md text-xs font-medium border border-[#c2c6d4]">
                            {item.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 🔵 Photo Evidence */}
                  {photos.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#424752] mb-2 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                        Photo Evidence ({photos.length})
                      </p>
                      <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {photos.slice(0, 4).map((pUrl, pIdx) => (
                          <img key={pIdx} src={pUrl} alt="Serving Photo" className="w-14 h-14 object-cover rounded-lg border border-[#c2c6d4]" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Weekly Schedule */}
        {!loading && !error && activeTab === 'weekly' && (
          <div className="bg-white border border-[#c2c6d4] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f3f4f5] border-b border-[#c2c6d4]">
                    {['Day', 'Breakfast', 'Lunch', 'Evening Snacks', 'Dinner'].map((h) => (
                      <th key={h} className="p-4 text-sm font-semibold text-[#424752]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c2c6d4]">
                  {weeklyMenu.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-sm text-[#424752] italic">
                        No weekly menu schedule published yet.
                      </td>
                    </tr>
                  ) : (
                    weeklyMenu.map((row, i) => {
                      const isToday = row.day === new Date().toLocaleDateString('en-US', { weekday: 'long' });
                      return (
                        <tr key={row.day || i} className={`transition-colors ${isToday ? 'bg-[#e8f5ea]' : i % 2 === 0 ? 'hover:bg-[#f9fafb]' : 'bg-[#fafafb] hover:bg-[#f3f4f5]'}`}>
                          <td className={`p-4 text-sm font-semibold ${isToday ? 'text-[#006e25]' : 'text-[#191c1d]'}`}>
                            {row.day} {isToday && <span className="ml-1 text-[10px] bg-[#006e25] text-white px-1.5 py-0.5 rounded-full">Today</span>}
                          </td>
                          <td className="p-4 text-sm text-[#424752]">{row.breakfast}</td>
                          <td className="p-4 text-sm text-[#424752]">{row.lunch}</td>
                          <td className="p-4 text-sm text-[#424752]">{row.snacks}</td>
                          <td className="p-4 text-sm text-[#424752]">{row.dinner}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: History */}
        {!loading && !error && activeTab === 'history' && (
          <div className="space-y-4">
            <div className="p-8 bg-white border border-[#c2c6d4] rounded-xl text-center text-[#424752]">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-50">history</span>
              <p className="text-sm font-medium">Meal attendance history synced with check-in records.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
