import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { messApi } from '@/services/mess-api';
import { FOOD_CATALOG_BY_CATEGORY, searchFoodCatalog, getMealDisplayName } from '@/data/food-options';

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Desserts', 'Drinks'];
const MEAL_SLOTS = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];

export default function ReportMealPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const initialSlot = queryParams.get('slot')?.toUpperCase() || 'LUNCH';

  const [mealType, setMealType] = useState(initialSlot);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [photoUrl, setPhotoUrl] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [consensusPreview, setConsensusPreview] = useState(null);

  const filteredFoods = searchFoodCatalog(activeCategory, searchQuery);

  useEffect(() => {
    fetchConsensus();
  }, [mealType]);

  const fetchConsensus = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await messApi.getMealConsensus(mealType, today).catch(() => null);
      setConsensusPreview(data);
    } catch (e) {
      console.error('Failed to fetch consensus:', e);
    }
  };

  const toggleItem = (foodName) => {
    if (selectedItems.includes(foodName)) {
      setSelectedItems(selectedItems.filter((i) => i !== foodName));
    } else {
      setSelectedItems([...selectedItems, foodName]);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      alert('Please select at least 1 food item being served!');
      return;
    }

    setSubmitting(true);
    setSuccessData(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await messApi.submitMealConsensus(mealType, today, selectedItems, photoUrl);
      setSuccessData(res);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      console.error('Failed to submit meal report:', err);
      alert('Error submitting report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8f9fa] text-[#191c1d] p-4 md:p-6 pb-24 md:pb-8 font-[Inter,sans-serif]">
      <main className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs text-[#003f87] font-semibold hover:underline transition"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to Dashboard
          </button>
          <span className="text-xs font-bold text-[#006e25] bg-[#e8f5ea] border border-[#006e25]/30 px-3 py-1 rounded-full">
            🏆 Earn up to +35 Contribution Pts
          </span>
        </div>

        {/* Page Title Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#003f87] flex items-center gap-2">
            <span>🍲</span> Report Today's Meal
          </h1>
          <p className="text-xs text-[#424752] mt-1">
            Help your hostel peers by reporting what is actually being served right now. Select items from the catalog below.
          </p>
        </div>

        {/* Success Banner */}
        {successData && (
          <div className="bg-[#e8f5ea] border border-[#006e25]/30 text-[#006e25] p-6 rounded-xl text-center space-y-2 animate-in fade-in duration-300 shadow-sm">
            <span className="text-4xl block">🎉</span>
            <h3 className="font-bold text-lg">{successData.message || 'Report Submitted Successfully!'}</h3>
            <p className="text-xs font-medium">
              Photos uploaded to gallery • Live consensus updated • Earned +{successData.pointsEarned || 20} Points!
            </p>
            <p className="text-[11px] text-[#424752] italic">Redirecting to Dashboard...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Active Meal Slot Selector */}
          <div className="bg-white border border-[#c2c6d4] rounded-xl p-4 shadow-sm space-y-3">
            <label className="text-xs font-bold text-[#424752] uppercase tracking-wider block">
              1. Select Active Meal Slot
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MEAL_SLOTS.map((slot) => (
                <button
                  type="button"
                  key={slot}
                  onClick={() => setMealType(slot)}
                  className={`py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    mealType === slot
                      ? 'bg-[#003f87] text-white shadow-sm font-bold'
                      : 'bg-[#f3f4f5] text-[#191c1d] border border-[#c2c6d4] hover:bg-[#e1e3e4]'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {slot === 'BREAKFAST' ? 'wb_twilight' : slot === 'LUNCH' ? 'light_mode' : slot === 'SNACKS' ? 'coffee' : 'nightlight'}
                  </span>
                  {getMealDisplayName(slot)}
                </button>
              ))}
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="bg-white border border-[#c2c6d4] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#424752] uppercase tracking-wider block">
                2. Select Foods Served ({selectedItems.length} Selected)
              </label>
              {selectedItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedItems([])}
                  className="text-xs text-[#ba1a1a] font-semibold hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Sticky Search Input */}
            <div className="sticky top-0 z-20 bg-white pt-1 pb-1">
              <div className="relative">
                <span className="absolute left-3 top-3 text-[#424752] text-sm">🔍</span>
                <input
                  type="text"
                  placeholder="Search food items (e.g. Idli, Sambar, Paneer, Dosa)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full min-h-[48px] bg-[#f3f4f5] border border-[#c2c6d4] rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold text-[#191c1d] focus:outline-none focus:border-[#003f87] shadow-sm"
                />
              </div>
            </div>

            {/* Horizontal Category Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`min-h-[38px] px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition active:scale-95 ${
                    activeCategory === cat
                      ? 'bg-[#003f87] text-white shadow-sm'
                      : 'bg-[#f3f4f5] text-[#191c1d] border border-[#c2c6d4] hover:bg-[#e1e3e4]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Selected Summary Badge */}
            {selectedItems.length > 0 && (
              <div className="bg-[#e8f5ea] border border-[#006e25]/30 p-3 rounded-xl text-xs text-[#006e25] font-semibold">
                <strong>Selected Served Items:</strong> {selectedItems.join(', ')}
              </div>
            )}

            {/* Responsive 2-Column Mobile Food Grid */}
            <div className="max-h-80 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {filteredFoods.map((food) => {
                  const isChecked = selectedItems.includes(food);
                  return (
                    <div
                      key={food}
                      onClick={() => toggleItem(food)}
                      className={`cursor-pointer min-h-[52px] p-3 rounded-xl border transition flex items-center justify-between gap-2 active:scale-95 ${
                        isChecked
                          ? 'bg-[#e8f5ea] border-[#006e25] text-[#006e25] font-bold shadow-sm'
                          : 'bg-[#f3f4f5] border-[#c2c6d4] text-[#191c1d] hover:bg-[#e1e3e4]'
                      }`}
                    >
                      <span className="text-xs font-semibold leading-snug">{food}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-5 h-5 accent-[#006e25] rounded cursor-pointer shrink-0"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Integrated Live Photo Upload (Take Photo / Choose File) */}
          <div className="bg-white border border-[#c2c6d4] rounded-xl p-5 shadow-sm space-y-3">
            <label className="text-xs font-bold text-[#424752] uppercase tracking-wider block">
              3. Upload Live Serving Photo (Optional +5 Pts)
            </label>
            <p className="text-[11px] text-[#424752]">
              Photos uploaded here automatically feed into the student Food Gallery.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <label className="min-h-[48px] px-4 bg-[#f3f4f5] border border-[#c2c6d4] text-[#003f87] text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer hover:bg-[#e1e3e4] active:scale-95 transition">
                <span className="material-symbols-outlined text-lg">photo_camera</span>
                Take Photo / Camera
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>

              <label className="min-h-[48px] px-4 bg-[#f3f4f5] border border-[#c2c6d4] text-[#191c1d] text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer hover:bg-[#e1e3e4] active:scale-95 transition">
                <span className="material-symbols-outlined text-lg">image</span>
                Choose Gallery
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>

              {photoUrl && (
                <div className="relative">
                  <img src={photoUrl} alt="Preview" className="w-14 h-14 object-cover rounded-xl border-2 border-[#006e25]" />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="absolute -top-2 -right-2 bg-[#ba1a1a] text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submit Bar (Mobile-First 52px Full Width Thumb Target) */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full sm:w-auto min-h-[48px] px-5 rounded-xl text-xs font-bold text-[#424752] border border-[#c2c6d4] hover:bg-[#f3f4f5] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || selectedItems.length === 0}
              className="w-full sm:w-auto min-h-[52px] px-8 rounded-xl text-sm font-extrabold text-white bg-[#006e25] hover:opacity-90 disabled:opacity-50 shadow-md transition active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-xl">send</span>
              {submitting ? 'Submitting Report...' : `Submit Menu Report (${selectedItems.length} Items)`}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}
