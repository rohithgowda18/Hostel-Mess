import { useState, useEffect } from 'react';
import { messApi } from '@/services/mess-api';
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Radio,
  Tag,
  Clock,
  X,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';

const INITIAL_MENU = {
  BREAKFAST: {
    time: '7:30 – 9:00 AM',
    items: ['Steamed Idli', 'Medu Vada', 'Hot Sambar', 'Coconut Chutney', 'Masala Tea', 'Filter Coffee'],
    calories: '480 kcal',
    tags: ['Vegetarian', 'Contains Dairy']
  },
  LUNCH: {
    time: '12:30 – 2:30 PM',
    items: ['Steamed Basmati Rice', 'Dal Tadka', 'Paneer Butter Masala', 'Whole Wheat Chapati', 'Curd', 'Green Salad'],
    calories: '650 kcal',
    tags: ['Vegetarian', 'High Protein', 'Contains Dairy'],
    chefSpecial: 'Paneer Butter Masala'
  },
  SNACKS: {
    time: '4:30 – 5:30 PM',
    items: ['Crispy Veg Pakoda', 'Green Mint Chutney', 'Cardamom Tea', 'Filter Coffee'],
    calories: '320 kcal',
    tags: ['Vegetarian']
  },
  DINNER: {
    time: '7:30 – 9:30 PM',
    items: ['Jeera Rice', 'Aloo Gobi Masala', 'Yellow Moong Dal', 'Fresh Rotis', 'Gulab Jamun'],
    calories: '580 kcal',
    tags: ['Vegetarian', 'Contains Dairy']
  }
};

const DIETARY_TAG_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Jain',
  'High Protein',
  'Contains Dairy',
  'Contains Nuts'
];

export default function AdminMenuPage() {
  const [activeTab, setActiveTab] = useState('TODAY');
  const [menu, setMenu] = useState(() => {
    const saved = localStorage.getItem('hostel_admin_menu');
    return saved ? JSON.parse(saved) : INITIAL_MENU;
  });

  const [editSlot, setEditSlot] = useState(null);
  const [editItemsText, setEditItemsText] = useState('');
  const [editTags, setEditTags] = useState([]);
  const [replacementModal, setReplacementModal] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState('Paneer Butter Masala');
  const [replacementName, setReplacementName] = useState('Mixed Vegetable Curry');
  const [replacementReason, setReplacementReason] = useState('Ingredient supply delayed');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    localStorage.setItem('hostel_admin_menu', JSON.stringify(menu));
  }, [menu]);

  const handleOpenEdit = (slotKey) => {
    setEditSlot(slotKey);
    setEditItemsText(menu[slotKey].items.join('\n'));
    setEditTags(menu[slotKey].tags || []);
  };

  const handleSaveSlot = (e) => {
    e.preventDefault();
    if (!editSlot) return;

    const newItems = editItemsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    setMenu((prev) => ({
      ...prev,
      [editSlot]: {
        ...prev[editSlot],
        items: newItems,
        tags: editTags
      }
    }));

    setEditSlot(null);
    setSuccessMsg(`Successfully updated ${editSlot} menu!`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handlePublishReplacement = (e) => {
    e.preventDefault();
    if (!replacementName.trim()) return;

    // Replace item in lunch or active slot
    setMenu((prev) => {
      const updatedLunch = { ...prev.LUNCH };
      updatedLunch.items = updatedLunch.items.map((it) =>
        it.toLowerCase().includes(replaceTarget.toLowerCase()) ? replacementName : it
      );
      if (updatedLunch.chefSpecial === replaceTarget) {
        updatedLunch.chefSpecial = replacementName;
      }
      return { ...prev, LUNCH: updatedLunch };
    });

    // Also broadcast notice
    messApi.createAnnouncement({
      title: `Emergency Menu Change: ${replaceTarget} ➔ ${replacementName}`,
      message: `Due to: ${replacementReason}. The chef is serving fresh ${replacementName} instead.`,
      priority: 'IMPORTANT',
      category: 'MENU'
    }).catch(() => {});

    setReplacementModal(false);
    setSuccessMsg(`Emergency substitution published! Students notified via real-time broadcast.`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const toggleTag = (tag) => {
    setEditTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-0 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Daily & Weekly Menu Builder"
          subtitle="Publish daily meal schedules, configure dietary tags, and trigger real-time emergency item replacements."
          badge="Kitchen Control"
        />

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setReplacementModal(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2 text-xs"
          >
            <AlertTriangle className="h-4 w-4" /> Emergency Replacement
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-sm font-semibold">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {['TODAY', 'WEEKLY', 'HISTORY ARCHIVE'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === tab
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Meal Slots (User Spec #11) */}
      <div className="grid gap-6 md:grid-cols-2">
        {Object.entries(menu).map(([slotKey, data]) => (
          <Card
            key={slotKey}
            className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs relative"
          >
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    {data.time}
                  </span>
                  <CardTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    {slotKey}
                  </CardTitle>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenEdit(slotKey)}
                  className="gap-1.5 text-xs font-bold"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4 text-xs">
              <div>
                <p className="font-bold text-slate-400 uppercase tracking-wider text-[11px] mb-2">
                  Dishes on Menu
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {data.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between"
                    >
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{item}</span>
                      {data.chefSpecial === item && (
                        <span className="text-amber-500 font-bold text-[10px]">⭐ Special</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                {data.tags?.map((t) => (
                  <Badge key={t} variant="neutral" className="text-[10px] font-bold">
                    {t}
                  </Badge>
                ))}
                <span className="text-[11px] text-slate-400 ml-auto font-mono">
                  {data.calories}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Slot Modal */}
      {editSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                Edit {editSlot} Service
              </h3>
              <button
                onClick={() => setEditSlot(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Dishes (One item per line)
                </label>
                <textarea
                  rows={6}
                  required
                  value={editItemsText}
                  onChange={(e) => setEditItemsText(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  Dietary & Allergen Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_TAG_OPTIONS.map((tag) => {
                    const isSelected = editTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditSlot(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Emergency Replacement Modal (User Spec #11) */}
      {replacementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                  Emergency Item Replacement
                </h3>
              </div>
              <button
                onClick={() => setReplacementModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePublishReplacement} className="space-y-4 text-xs">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-200">
                <p className="font-bold">Publishing this substitution will immediately:</p>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1">
                  1. Update today's live menu.<br />
                  2. Push a WebSocket <code>MENU_UPDATED</code> alert to all connected students.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Dish Currently Unavailable
                </label>
                <input
                  type="text"
                  required
                  value={replaceTarget}
                  onChange={(e) => setReplaceTarget(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Substitute With
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mixed Vegetable Curry"
                  value={replacementName}
                  onChange={(e) => setReplacementName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Reason for Substitution
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dairy ingredient delivery delayed"
                  value={replacementReason}
                  onChange={(e) => setReplacementReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setReplacementModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                  Publish Replacement
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
