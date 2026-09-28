import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { messApi } from '@/services/mess-api';
import { searchFoodCatalog, FOOD_CATALOG_BY_CATEGORY } from '@/data/food-options';
import {
  Camera,
  Search,
  Plus,
  X,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Upload,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const MEAL_SLOTS = [
  { key: 'BREAKFAST', label: 'Breakfast' },
  { key: 'LUNCH', label: 'Lunch' },
  { key: 'SNACKS', label: 'Snacks' },
  { key: 'DINNER', label: 'Dinner' }
];

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Snacks', 'Dinner'];

export default function ReportMealPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSlot = searchParams.get('slot')?.toUpperCase() || 'LUNCH';

  const [mealType, setMealType] = useState(initialSlot);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [customInput, setCustomInput] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [caption, setCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);

  const filteredFoods = searchFoodCatalog(activeCategory, searchQuery);
  const todayStr = new Date().toISOString().split('T')[0];

  const toggleItem = (foodName) => {
    if (selectedItems.includes(foodName)) {
      setSelectedItems(selectedItems.filter((i) => i !== foodName));
    } else {
      setSelectedItems([...selectedItems, foodName]);
    }
  };

  const handleAddCustom = (e) => {
    e.preventDefault();
    const clean = customInput.trim();
    if (clean && !selectedItems.includes(clean)) {
      setSelectedItems([...selectedItems, clean]);
      setCustomInput('');
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      // Client-side downscale for fast responsive uploads
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1000;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        setPhotoPreview(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Case A: Food only, Case B: Photo only, Case C: Food + photo
    if (selectedItems.length === 0 && !photoFile && !photoPreview) {
      setErrorMsg('Please select/enter food items OR attach a meal photo before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      let uploadedPhotoUrl = photoPreview || '';

      // Upload binary to photo storage if a file is present
      if (photoFile) {
        const formData = new FormData();
        formData.append('images', photoFile);
        formData.append('mealType', mealType);
        formData.append('description', caption || (selectedItems.length > 0 ? selectedItems.join(', ') : 'Live meal evidence'));
        const photoRes = await messApi.uploadStudentPhoto(formData).catch(() => null);
        if (photoRes && photoRes.id) {
          uploadedPhotoUrl = `/api/student-photos/${photoRes.id}/image`;
        }
      }

      // Submit peer consensus report
      const res = await messApi.submitMealConsensus(mealType, todayStr, selectedItems, uploadedPhotoUrl);
      setSuccessData(res);

      setTimeout(() => {
        navigate('/student/meals');
      }, 1500);
    } catch (err) {
      console.error('Error submitting report:', err);
      setErrorMsg('Failed to submit meal report. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Back button & Title */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/student/meals')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Meals
        </button>
        <span className="text-[11px] font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-full border border-teal-200 dark:border-teal-800">
          +20 Contribution Points
        </span>
      </div>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Report This Meal
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Verify dishes or share plate photos to answer what is actually being served right now.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successData && (
        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/40 text-green-800 dark:text-green-200 text-xs font-semibold text-center space-y-1">
          <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto" />
          <p className="text-sm font-bold">Report Submitted Successfully!</p>
          <p className="text-green-700 dark:text-green-300 text-[11px]">
            {successData.message || 'Points added to your resident score. Returning to meals...'}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Step 1: Select Meal Slot */}
        <Card className="p-4 space-y-2.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            1. Select Meal Slot
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {MEAL_SLOTS.map((slot) => {
              const isSelected = mealType === slot.key;
              return (
                <button
                  key={slot.key}
                  type="button"
                  onClick={() => setMealType(slot.key)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer text-center ${
                    isSelected
                      ? 'bg-teal-700 text-white border-teal-700 dark:bg-teal-500 dark:text-slate-950'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {slot.label}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Step 2: What Are You Seeing? */}
        <Card className="p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                2. What Are You Seeing? ({selectedItems.length} selected)
              </label>
              <p className="text-[11px] text-slate-400">Select dishes or add custom items below.</p>
            </div>
            {selectedItems.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedItems([])}
                className="text-[11px] font-semibold text-red-600 hover:underline cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Selected Chips */}
          {selectedItems.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              {selectedItems.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-semibold"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => toggleItem(item)}
                    className="hover:text-red-600 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <div className="p-3 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No food items selected yet. Tap chips from below or type custom food.
            </div>
          )}

          {/* Custom Food Entry Input */}
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Type custom food not in list (e.g., Benne Dosa, Kesari Bath)..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustom(e);
                }
              }}
              className="text-xs h-9"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddCustom}
              className="text-xs font-bold gap-1 shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>

          {/* Search Catalog */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search food catalog..."
                className="pl-9 h-8 text-xs"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Standard Food Chips */}
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 border border-slate-100 dark:border-slate-800 rounded-xl">
              {filteredFoods.map((food) => {
                const isSelected = selectedItems.includes(food);
                return (
                  <button
                    key={food}
                    type="button"
                    onClick={() => toggleItem(food)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-teal-700 text-white border-teal-700 dark:bg-teal-500 dark:text-slate-950 font-bold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {isSelected ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                    {food}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Step 3: Photo Evidence (Optional) */}
        <Card className="p-4 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            3. Photo Evidence (Optional, or standalone photo report)
          </label>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer shadow-xs">
              <Camera className="h-4 w-4 text-teal-700 dark:text-teal-400" />
              Take or Choose Photo
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </label>

            {photoPreview && (
              <div className="flex items-center gap-3">
                <img
                  src={photoPreview}
                  alt="Plate preview"
                  className="h-14 w-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
                >
                  Remove Photo
                </button>
              </div>
            )}
          </div>

          {photoPreview && (
            <Input
              type="text"
              placeholder="Optional photo caption (e.g. Counter 1 plating)..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="text-xs h-9"
            />
          )}
        </Card>

        {/* Submit Primary CTA */}
        <Button
          type="submit"
          disabled={submitting}
          className="w-full h-11 text-sm font-bold"
        >
          {submitting ? 'Submitting Meal Report...' : 'Submit Meal Report'}
        </Button>
      </form>
    </div>
  );
}
