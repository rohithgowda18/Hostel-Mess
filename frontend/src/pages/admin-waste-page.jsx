import { useState, useEffect } from 'react';
import {
  Trash2,
  Plus,
  Scale,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  X,
  PieChart,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';

const INITIAL_WASTE_LOGS = [
  { id: 'W-1', meal: 'Lunch', food: 'Steamed Rice', preparedKg: 120, servedKg: 105, kitchenKg: 7, plateKg: 8, totalWasteKg: 15, cost: '₹1,200', date: 'Today' },
  { id: 'W-2', meal: 'Lunch', food: 'Dal Tadka', preparedKg: 45, servedKg: 38, kitchenKg: 3, plateKg: 4, totalWasteKg: 7, cost: '₹840', date: 'Today' },
  { id: 'W-3', meal: 'Breakfast', food: 'Sambar & Chutney', preparedKg: 40, servedKg: 34, kitchenKg: 2, plateKg: 4, totalWasteKg: 6, cost: '₹550', date: 'Today' },
  { id: 'W-4', meal: 'Breakfast', food: 'Upma', preparedKg: 30, servedKg: 24, kitchenKg: 2, plateKg: 4, totalWasteKg: 6, cost: '₹480', date: 'Today' },
];

export default function AdminWastePage() {
  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem('hostel_waste_logs');
    return saved ? JSON.parse(saved) : INITIAL_WASTE_LOGS;
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    meal: 'Lunch',
    food: 'Basmati Rice',
    preparedKg: 120,
    servedKg: 105,
    kitchenKg: 7,
    plateKg: 8
  });
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    localStorage.setItem('hostel_waste_logs', JSON.stringify(logs));
  }, [logs]);

  const totalPrepared = logs.reduce((acc, l) => acc + l.preparedKg, 0);
  const totalServed = logs.reduce((acc, l) => acc + l.servedKg, 0);
  const totalWaste = logs.reduce((acc, l) => acc + l.totalWasteKg, 0);
  const wasteRate = totalPrepared > 0 ? ((totalWaste / totalPrepared) * 100).toFixed(1) : 0;

  const handleSaveWaste = (e) => {
    e.preventDefault();
    const kitchen = Number(form.kitchenKg);
    const plate = Number(form.plateKg);
    const waste = kitchen + plate;

    const newLog = {
      id: `W-${Date.now()}`,
      meal: form.meal,
      food: form.food,
      preparedKg: Number(form.preparedKg),
      servedKg: Number(form.servedKg),
      kitchenKg: kitchen,
      plateKg: plate,
      totalWasteKg: waste,
      cost: `₹${waste * 85}`,
      date: 'Today'
    };

    setLogs([newLog, ...logs]);
    setModalOpen(false);
    setSuccessMsg('Waste metrics safely recorded into kitchen logs!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-0 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Kitchen & Dining Waste Analytics"
          subtitle="Audit kitchen prep vs plate waste, track food conversion metrics, and minimize hostel dining hall loss."
          badge="Zero-Waste Monitor"
        />

        <Button
          size="sm"
          onClick={() => setModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 text-xs shadow-xs"
        >
          <Plus className="h-4 w-4" /> Record Food Waste
        </Button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-sm font-semibold">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* KPI Stats (User Spec #16) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Prepared</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{totalPrepared} <span className="text-sm font-medium text-slate-400">kg</span></p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Consumed / Served</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{totalServed} <span className="text-sm font-medium text-slate-400">kg</span></p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">Recorded Waste</p>
            <p className="text-2xl font-black text-amber-500 mt-1">{totalWaste} <span className="text-sm font-medium text-slate-400">kg</span></p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">Waste Rate</p>
            <p className="text-2xl font-black text-rose-500 mt-1">{wasteRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Waste Audit Table */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            Daily Batch Preparation vs Waste Log
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-3.5 pl-4">Meal</th>
                <th className="p-3.5">Food Item</th>
                <th className="p-3.5">Prepared (kg)</th>
                <th className="p-3.5">Served (kg)</th>
                <th className="p-3.5">Kitchen Leftover</th>
                <th className="p-3.5">Plate Waste</th>
                <th className="p-3.5">Total Waste</th>
                <th className="p-3.5 text-right pr-4">Cost Loss</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 pl-4">
                    <Badge variant="neutral" className="text-[10px] font-bold">{log.meal}</Badge>
                  </td>
                  <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                    {log.food}
                  </td>
                  <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300">
                    {log.preparedKg} kg
                  </td>
                  <td className="p-3.5 font-mono text-emerald-600">
                    {log.servedKg} kg
                  </td>
                  <td className="p-3.5 font-mono text-slate-500">
                    {log.kitchenKg} kg
                  </td>
                  <td className="p-3.5 font-mono text-amber-500">
                    {log.plateKg} kg
                  </td>
                  <td className="p-3.5 font-mono font-bold text-rose-600">
                    {log.totalWasteKg} kg
                  </td>
                  <td className="p-3.5 text-right pr-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                    {log.cost}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Record Waste Modal (User Spec #16) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-amber-500" />
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                  Record Food Waste Metrics
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWaste} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Meal</label>
                  <select
                    value={form.meal}
                    onChange={(e) => setForm({ ...form, meal: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold"
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Dinner">Dinner</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Food Item</label>
                  <input
                    type="text"
                    required
                    value={form.food}
                    onChange={(e) => setForm({ ...form, food: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Prepared (kg)</label>
                  <input
                    type="number"
                    required
                    value={form.preparedKg}
                    onChange={(e) => setForm({ ...form, preparedKg: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Served / Consumed (kg)</label>
                  <input
                    type="number"
                    required
                    value={form.servedKg}
                    onChange={(e) => setForm({ ...form, servedKg: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Kitchen Waste (kg)</label>
                  <input
                    type="number"
                    required
                    value={form.kitchenKg}
                    onChange={(e) => setForm({ ...form, kitchenKg: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Plate Waste (kg)</label>
                  <input
                    type="number"
                    required
                    value={form.plateKg}
                    onChange={(e) => setForm({ ...form, plateKg: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                  Save Waste Record
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
