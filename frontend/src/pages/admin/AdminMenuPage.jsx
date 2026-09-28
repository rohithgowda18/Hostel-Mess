import { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Edit2,
  Save,
  CheckCircle2,
  AlertTriangle,
  Clock,
  X,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { messApi } from '@/services/mess-api';

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const MEALS = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];

const DEFAULT_WEEKLY_MENU = {
  MONDAY: {
    BREAKFAST: ['Idli', 'Vada', 'Sambar', 'Coconut Chutney', 'Tea/Coffee'],
    LUNCH: ['Steamed Rice', 'Dal Tadka', 'Paneer Curry', 'Roti', 'Curd'],
    SNACKS: ['Veg Pakoda', 'Green Chutney', 'Tea/Coffee'],
    DINNER: ['Jeera Rice', 'Aloo Gobi', 'Dal', 'Roti', 'Gulab Jamun']
  },
  TUESDAY: {
    BREAKFAST: ['Poori', 'Saagu', 'Kesari Bath', 'Tea/Coffee'],
    LUNCH: ['Rice', 'Rasam', 'Chole Masala', 'Bhature', 'Salad'],
    SNACKS: ['Samosa', 'Sweet Chutney', 'Tea/Coffee'],
    DINNER: ['Fried Rice', 'Veg Manchurian', 'Roti', 'Dal', 'Banana']
  },
  WEDNESDAY: {
    BREAKFAST: ['Set Dosa', 'Veg Sagu', 'Chutney', 'Tea/Coffee'],
    LUNCH: ['Lemon Rice', 'Curd Rice', 'Sambar', 'Potato Fry', 'Papad'],
    SNACKS: ['Mirchi Bajji', 'Chutney', 'Tea/Coffee'],
    DINNER: ['Ghee Rice', 'Veg Kurma', 'Dal Fry', 'Chapati', 'Ice Cream']
  },
  THURSDAY: {
    BREAKFAST: ['Khara Bath', 'Kesari Bath', 'Coconut Chutney', 'Tea/Coffee'],
    LUNCH: ['Rice', 'Drumstick Sambar', 'Bhindi Masala', 'Roti', 'Curd'],
    SNACKS: ['Poha / Avalakki', 'Tea/Coffee'],
    DINNER: ['Pulao', 'Raita', 'Dal Tadka', 'Roti', 'Kheer']
  },
  FRIDAY: {
    BREAKFAST: ['Thatte Idli', 'Vada', 'Sambar', 'Red Chutney', 'Tea/Coffee'],
    LUNCH: ['Bisibele Bath', 'Boondi', 'Curd Rice', 'Papad', 'Pickle'],
    SNACKS: ['Bread Pakoda', 'Sauce', 'Tea/Coffee'],
    DINNER: ['Paneer Pulao', 'Mix Veg Curry', 'Roti', 'Dal', 'Custard']
  },
  SATURDAY: {
    BREAKFAST: ['Neer Dosa', 'Coconut Chutney', 'Veg Sagu', 'Tea/Coffee'],
    LUNCH: ['Jeera Rice', 'Rajma Masala', 'Chapati', 'Salad', 'Curd'],
    SNACKS: ['Onion Bajji', 'Tea/Coffee'],
    DINNER: ['Special Feast Pulao', 'Paneer Tikka Gravy', 'Parotta', 'Raita', 'Rasgulla']
  },
  SUNDAY: {
    BREAKFAST: ['Masala Dosa', 'Sambar', 'Chutney', 'Tea/Coffee'],
    LUNCH: ['Veg Biryani', 'Mirchi Ka Salan', 'Raita', 'Sweet Corn Soup'],
    SNACKS: ['Biscuits / Mixture', 'Tea/Coffee'],
    DINNER: ['Khichdi', 'Kadhi', 'Aloo Methi', 'Roti', 'Fruit Salad']
  }
};

export default function AdminMenuPage() {
  const [selectedDay, setSelectedDay] = useState('MONDAY');
  const [menu, setMenu] = useState(() => {
    const saved = localStorage.getItem('hostel_weekly_menu');
    return saved ? JSON.parse(saved) : DEFAULT_WEEKLY_MENU;
  });

  const [editModal, setEditModal] = useState({
    open: false,
    day: '',
    meal: '',
    itemsText: ''
  });

  const [replacementModal, setReplacementModal] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState('');
  const [replacementName, setReplacementName] = useState('');
  const [replacementReason, setReplacementReason] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    localStorage.setItem('hostel_weekly_menu', JSON.stringify(menu));
  }, [menu]);

  const handleOpenEdit = (day, meal) => {
    const items = menu[day]?.[meal] || [];
    setEditModal({
      open: true,
      day,
      meal,
      itemsText: items.join('\n')
    });
  };

  const handleSaveSlot = (e) => {
    e.preventDefault();
    const { day, meal, itemsText } = editModal;
    const newItems = itemsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    setMenu((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [meal]: newItems
      }
    }));

    setEditModal({ open: false, day: '', meal: '', itemsText: '' });
    setSuccessMsg(`Successfully saved ${day} ${meal} menu.`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handlePublishReplacement = (e) => {
    e.preventDefault();
    if (!replaceTarget.trim() || !replacementName.trim()) return;

    // Substitute dish in currently selected day and lunch/active meal
    setMenu((prev) => {
      const daySchedule = { ...prev[selectedDay] };
      Object.keys(daySchedule).forEach((m) => {
        daySchedule[m] = daySchedule[m].map((dish) =>
          dish.toLowerCase() === replaceTarget.toLowerCase() ? replacementName : dish
        );
      });
      return { ...prev, [selectedDay]: daySchedule };
    });

    messApi.createAnnouncement({
      title: `Emergency Menu Change: ${replaceTarget} ➔ ${replacementName}`,
      message: `Due to: ${replacementReason || 'Kitchen operational requirement'}. The mess is serving ${replacementName} instead.`,
      priority: 'IMPORTANT',
      category: 'MENU'
    }).catch(() => {});

    setReplacementModal(false);
    setReplaceTarget('');
    setReplacementName('');
    setReplacementReason('');
    setSuccessMsg(`Replacement published and notice broadcasted to residents!`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const daySchedule = menu[selectedDay] || {};

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black text-text tracking-tight">
              Weekly Menu Management
            </h1>
            <Badge variant="primary" className="text-[11px] font-bold">
              Official Meal Schedule
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Configure the 7-day cyclical dining menu, publish schedule updates, or trigger emergency dish substitutions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setReplacementModal(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5 text-xs"
          >
            <AlertTriangle className="h-3.5 w-3.5" /> Emergency Substitution
          </Button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-success/10 border border-success/30 text-success text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Day Selector (Section 26) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border">
        {DAYS_OF_WEEK.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedDay === day
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface border border-border text-text-secondary hover:text-text hover:bg-surface-elevated'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* 4 Meal Sections for Selected Day */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MEALS.map((meal) => {
          const items = daySchedule[meal] || [];

          return (
            <Card key={meal} className="bg-surface border-border overflow-hidden">
              <div className="p-4 bg-surface-elevated border-b border-border flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                    {selectedDay}
                  </span>
                  <h3 className="text-base font-extrabold text-text">{meal}</h3>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenEdit(selectedDay, meal)}
                  className="text-xs font-semibold gap-1 h-8"
                >
                  <Edit2 className="h-3 w-3" /> Edit Dishes
                </Button>
              </div>

              <div className="p-4 space-y-3">
                <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
                  Scheduled Dishes ({items.length})
                </span>

                {items.length === 0 ? (
                  <p className="text-xs text-text-muted italic py-3">No dishes configured for this meal.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {items.map((dish, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-elevated border border-border text-text"
                      >
                        {dish}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Edit Slot Modal */}
      {editModal.open && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-surface rounded-2xl p-5 border border-border shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-text">
                  Edit {editModal.day} • {editModal.meal}
                </h3>
                <p className="text-xs text-text-secondary">Update planned dishes (one dish per line)</p>
              </div>
              <button
                onClick={() => setEditModal({ open: false, day: '', meal: '', itemsText: '' })}
                className="p-1 rounded-lg text-text-muted hover:text-text cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-text block mb-1.5">Dishes List</label>
                <textarea
                  rows={6}
                  required
                  value={editModal.itemsText}
                  onChange={(e) => setEditModal({ ...editModal, itemsText: e.target.value })}
                  placeholder="e.g.&#10;Steamed Idli&#10;Medu Vada&#10;Sambar"
                  className="w-full rounded-xl border border-border bg-surface-elevated p-3 text-xs text-text font-mono focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditModal({ open: false, day: '', meal: '', itemsText: '' })}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-primary hover:bg-primary-hover text-white font-bold text-xs">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Emergency Replacement Modal */}
      {replacementModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-surface rounded-2xl p-5 border border-border shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <div>
                  <h3 className="text-sm font-bold text-text">Emergency Dish Replacement</h3>
                  <p className="text-xs text-text-secondary">Instantly replace an unavailable dish and notify students</p>
                </div>
              </div>
              <button
                onClick={() => setReplacementModal(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handlePublishReplacement} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-text block mb-1">Original Dish Unavailable</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paneer Butter Masala"
                  value={replaceTarget}
                  onChange={(e) => setReplaceTarget(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-xs text-text"
                />
              </div>

              <div>
                <label className="font-bold text-text block mb-1">Substitute Dish Being Served</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mixed Vegetable Curry"
                  value={replacementName}
                  onChange={(e) => setReplacementName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-xs text-text"
                />
              </div>

              <div>
                <label className="font-bold text-text block mb-1">Reason for Change</label>
                <input
                  type="text"
                  placeholder="e.g. Supply shortage or dairy delivery delay"
                  value={replacementReason}
                  onChange={(e) => setReplacementReason(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-xs text-text"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReplacementModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs">
                  Broadcast Substitution
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
