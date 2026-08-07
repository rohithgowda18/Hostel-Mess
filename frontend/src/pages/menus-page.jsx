import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Plus, Trash2, Save, SlidersHorizontal, Clock, Star } from 'lucide-react';
import { messApi } from '@/services/mess-api';
import { getUser } from '@/services/auth-service';
import TodaysMenuCard from '@/components/dashboard/todays-menu-card';
import { getMealDisplayName } from '@/data/food-options';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const MEALS = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];

function MenusPage() {
  const user = getUser();
  const isAdmin = user?.role === 'ADMIN';

  const getMonday = (d) => {
    d = new Date(d);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  };

  const [activeTab, setActiveTab] = useState('today');

  // Today Menu States
  const [todayMenu, setTodayMenu] = useState({});
  const activeMealSlot = (() => {
    const minutes = new Date().getHours() * 60 + new Date().getMinutes();
    if (minutes >= 7 * 60 && minutes <= 11 * 60) return 'BREAKFAST';
    if (minutes >= 11 * 60 + 30 && minutes <= 15 * 60) return 'LUNCH';
    if (minutes >= 16 * 60 && minutes <= 18 * 60) return 'SNACKS';
    return 'DINNER';
  })();

  // Weekly Menu States
  const [weekStartDate, setWeekStartDate] = useState(() => getMonday(new Date()));
  const [editingWeeklyMenu, setEditingWeeklyMenu] = useState({});

  // History States
  const [historyDate, setHistoryDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [historyMenu, setHistoryMenu] = useState({});
  const [compareDate, setCompareDate] = useState('');
  const [compareMenu, setCompareMenu] = useState({});
  const [showCompare, setShowCompare] = useState(false);

  const fetchTodayMenu = async () => {
    try {
      const data = await messApi.getAllTodayMeals(MEALS);
      setTodayMenu({
        breakfast: data.BREAKFAST?.items || [],
        lunch: data.LUNCH?.items || [],
        snacks: data.SNACKS?.items || [],
        dinner: data.DINNER?.items || []
      });
    } catch (e) {
      console.error(e);
    }
  };

  const fetchWeeklyMenu = async (startDate) => {
    try {
      const data = await messApi.getWeeklyMenu(startDate);
      setEditingWeeklyMenu(data);
    } catch (err) {
      const empty = { weekStartDate: startDate };
      DAYS.forEach((day) => {
        empty[day] = { BREAKFAST: [], LUNCH: [], SNACKS: [], DINNER: [] };
      });
      setEditingWeeklyMenu(empty);
    }
  };

  const fetchHistoryMenu = async (targetDate, isCompare = false) => {
    const results = {};
    for (const m of MEALS) {
      try {
        const response = await messApi.getTodayMeal(m);
        if (response && response.date === targetDate) {
          results[m] = response.items || [];
        } else {
          results[m] = [];
        }
      } catch (e) {
        results[m] = [];
      }
    }
    if (isCompare) {
      setCompareMenu(results);
    } else {
      setHistoryMenu(results);
    }
  };

  useEffect(() => {
    if (activeTab === 'today') {
      fetchTodayMenu();
    } else if (activeTab === 'weekly') {
      fetchWeeklyMenu(weekStartDate);
    } else if (activeTab === 'history') {
      fetchHistoryMenu(historyDate, false);
    }
  }, [activeTab, weekStartDate, historyDate]);

  useEffect(() => {
    if (compareDate && showCompare && activeTab === 'history') {
      fetchHistoryMenu(compareDate, true);
    }
  }, [compareDate, showCompare, activeTab]);

  const handleSaveWeekly = async () => {
    try {
      await messApi.saveWeeklyMenu(editingWeeklyMenu);
      alert('Weekly menu saved successfully!');
    } catch (err) {
      alert('Failed to save weekly menu');
    }
  };

  const handleWeeklyAddItem = (day, meal, val) => {
    if (!val.trim()) return;
    const currentList = editingWeeklyMenu[day]?.[meal] || [];
    setEditingWeeklyMenu({
      ...editingWeeklyMenu,
      [day]: {
        ...editingWeeklyMenu[day],
        [meal]: [...currentList, val.trim()]
      }
    });
  };

  const handleWeeklyRemoveItem = (day, meal, idx) => {
    const currentList = editingWeeklyMenu[day]?.[meal] || [];
    setEditingWeeklyMenu({
      ...editingWeeklyMenu,
      [day]: {
        ...editingWeeklyMenu[day],
        [meal]: currentList.filter((_, i) => i !== idx)
      }
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Menus</h1>
          <p className="text-sm text-muted">Daily meals, weekly planning, and search history</p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-900 border border-border/60 rounded-xl p-1 text-xs">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${activeTab === 'today' ? 'bg-primary text-white' : 'text-muted hover:text-foreground'}`}
          >
            Today's Menu
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${activeTab === 'weekly' ? 'bg-primary text-white' : 'text-muted hover:text-foreground'}`}
          >
            Weekly Menu
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${activeTab === 'history' ? 'bg-primary text-white' : 'text-muted hover:text-foreground'}`}
          >
            Menu History
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'today' && (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <TodaysMenuCard menu={todayMenu} currentMeal={activeMealSlot} />
          </div>
          <Card className="bg-slate-900 border-border h-fit">
            <CardHeader>
              <CardTitle className="text-sm">Meal Timeslots</CardTitle>
              <CardDescription>Plan your mess visits accordingly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs text-foreground">
              <div className="flex justify-between pb-2 border-b border-border/30">
                <span className="font-semibold text-primary">Breakfast</span>
                <span className="text-muted">7:00 AM - 11:00 AM</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-border/30">
                <span className="font-semibold text-primary">Lunch</span>
                <span className="text-muted">11:30 AM - 3:00 PM</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-border/30">
                <span className="font-semibold text-primary">Snacks</span>
                <span className="text-muted">4:00 PM - 6:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-primary">Dinner</span>
                <span className="text-muted">7:00 PM - 11:00 PM</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'weekly' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-xl border border-border/50">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted" />
              <Input
                type="date"
                value={weekStartDate}
                onChange={(e) => setWeekStartDate(getMonday(e.target.value))}
                className="bg-slate-950 border-border text-xs max-w-[160px]"
              />
            </div>
            {isAdmin && (
              <Button onClick={handleSaveWeekly} size="sm" className="gap-2">
                <Save className="h-4 w-4" /> Save Weekly Menu
              </Button>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {DAYS.map((day) => (
              <Card key={day} className="bg-slate-900/50 border-border">
                <CardHeader className="py-3 border-b border-border/40">
                  <CardTitle className="capitalize text-sm font-semibold">{day}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {MEALS.map((meal) => {
                    const items = editingWeeklyMenu[day]?.[meal] || [];
                    return (
                      <div key={meal} className="space-y-2 pb-3 border-b border-border/20 last:border-0 last:pb-0">
                        <span className="text-[10px] font-bold text-primary uppercase">{meal}</span>
                        <div className="flex flex-wrap gap-1.5">
                          {items.length === 0 ? (
                            <span className="text-[10px] text-muted">No items</span>
                          ) : (
                            items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-1 bg-slate-950/60 border border-border/60 rounded px-1.5 py-0.5 text-[10px]">
                                <span>{item}</span>
                                {isAdmin && (
                                  <button onClick={() => handleWeeklyRemoveItem(day, meal, idx)} className="text-danger hover:text-red-400">
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                        {isAdmin && (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              const input = e.target.elements.foodItem;
                              handleWeeklyAddItem(day, meal, input.value);
                              input.value = '';
                            }}
                            className="flex gap-1 pt-1"
                          >
                            <Input name="foodItem" placeholder="Add food..." className="h-7 text-[10px] bg-slate-950 border-border" />
                            <Button type="submit" size="sm" className="h-7 px-2"><Plus className="h-3 w-3" /></Button>
                          </form>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4 items-end bg-slate-900/40 p-4 rounded-xl border border-border">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted uppercase">Select Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  type="date"
                  value={historyDate}
                  onChange={(e) => setHistoryDate(e.target.value)}
                  className="pl-9 bg-slate-950 border-border text-xs"
                />
              </div>
            </div>

            <Button
              variant="secondary"
              onClick={() => setShowCompare(!showCompare)}
              className="gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {showCompare ? 'Hide Comparison' : 'Compare Date'}
            </Button>

            {showCompare && (
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted uppercase">Compare Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <Input
                    type="date"
                    value={compareDate}
                    onChange={(e) => setCompareDate(e.target.value)}
                    className="pl-9 bg-slate-950 border-border text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-slate-900 border-border">
              <CardHeader>
                <CardTitle>Menu for {historyDate}</CardTitle>
                <CardDescription>Primary selected day</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {MEALS.map((meal) => {
                  const items = historyMenu[meal] || [];
                  return (
                    <div key={meal} className="border-b border-border/50 pb-3 last:border-0 last:pb-0">
                      <h4 className="font-semibold text-primary text-xs mb-1 uppercase">{meal}</h4>
                      {items.length === 0 ? (
                        <p className="text-[10px] text-muted">No items posted</p>
                      ) : (
                        <p className="text-xs text-foreground">{items.join(', ')}</p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {showCompare && (
              <Card className="bg-slate-900 border-border border-dashed">
                <CardHeader>
                  <CardTitle>Menu for {compareDate || 'Select Date'}</CardTitle>
                  <CardDescription>Comparison target day</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!compareDate ? (
                    <div className="py-10 text-center text-xs text-muted">Please select a comparison date</div>
                  ) : (
                    MEALS.map((meal) => {
                      const items = compareMenu[meal] || [];
                      return (
                        <div key={meal} className="border-b border-border/50 pb-3 last:border-0 last:pb-0">
                          <h4 className="font-semibold text-primary text-xs mb-1 uppercase">{meal}</h4>
                          {items.length === 0 ? (
                            <p className="text-[10px] text-muted">No items posted</p>
                          ) : (
                            <p className="text-xs text-foreground">{items.join(', ')}</p>
                          )}
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MenusPage;
