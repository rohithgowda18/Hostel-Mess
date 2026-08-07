import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { messApi } from '@/services/mess-api';

export default function StudentFoodPhotosPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('All Meals');
  const [lightbox, setLightbox] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [lightboxIndex, setLightboxIndex] = useState(null);

  const handleOpenLightbox = (index) => {
    setLightboxIndex(index);
  };

  const handlePrevImage = (e) => {
    e.stopPropagation();
    if (lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    }
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    if (lightboxIndex < filtered.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
    }
  };

  const currentPhoto = lightboxIndex !== null ? filtered[lightboxIndex] : null;

  return (
    <div className="flex-1 flex flex-col md:ml-0 h-full overflow-hidden font-[Inter,sans-serif] bg-[#f8f9fa] dark:bg-[#0F172A] transition-colors duration-200">
      <main className="flex-1 overflow-y-auto bg-[#f8f9fa] dark:bg-[#0F172A] text-[#191c1d] dark:text-[#F8FAFC] p-3 md:p-6 pb-24 md:pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 mt-2">
          <div>
            <h2 className="text-[32px] md:text-[45px] font-semibold text-[#003f87] dark:text-[#3B82F6] leading-9 md:leading-[52px]">Community Food Gallery</h2>
            <p className="text-xs text-[#424752] dark:text-[#94A3B8] mt-1">Live photos uploaded by students during meal reports today.</p>
          </div>
          <button
            onClick={() => navigate('/report-meal')}
            className="w-full sm:w-auto min-h-[48px] px-5 bg-[#006e25] dark:bg-[#22C55E] text-white dark:text-slate-950 font-bold rounded-xl text-xs shadow-sm hover:opacity-90 active:scale-95 transition flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">rate_review</span>
            Report Served Meal & Add Photo
          </button>
        </div>

        {/* Read-only Information Banner */}
        <div className="mb-6 p-4 bg-[#e8f5ea] dark:bg-[#22C55E]/10 border border-[#006e25]/30 dark:border-[#22C55E]/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#006e25] dark:text-[#22C55E]">
          <div className="flex items-center gap-2">
            <span className="text-base">💡</span>
            <span>Photos are automatically contributed when you report today's served meal (+5 Bonus Pts).</span>
          </div>
          <button onClick={() => navigate('/report-meal')} className="font-bold underline hover:opacity-80 text-left sm:text-right">
            Report Meal Now
          </button>
        </div>

        {/* Filters Bar */}
        <div className="bg-white dark:bg-[#1E293B] border border-[#c2c6d4] dark:border-[#334155] rounded-xl p-3 mb-6 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto w-full no-scrollbar">
            {['All Meals', 'Breakfast', 'Lunch', 'Snacks', 'Dinner'].map((f) => (
              <button
                key={f}
                onClick={() => { setActiveFilter(f); setLightboxIndex(null); }}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                  activeFilter === f
                    ? 'bg-[#003f87] dark:bg-[#3B82F6] text-white shadow-sm font-bold'
                    : 'bg-[#f3f4f5] dark:bg-[#0F172A] text-[#191c1d] dark:text-[#CBD5E1] border border-[#c2c6d4] dark:border-[#334155] hover:bg-[#e1e3e4] dark:hover:bg-[#334155]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile-First 2-Column Masonry Grid */}
        {loading ? (
          <div className="py-24 text-center text-xs text-[#424752]">Loading community photos...</div>
        ) : filtered.length === 0 ? (
          <div className="py-24 flex flex-col items-center gap-3 text-[#424752]">
            <span className="material-symbols-outlined text-[48px] opacity-40">photo_library</span>
            <p className="text-xs font-semibold">No food photos uploaded for this meal yet.</p>
            <button
              onClick={() => navigate('/report-meal')}
              className="text-[#003f87] font-bold text-xs hover:underline mt-1"
            >
              Be the first to upload a photo (+5 Pts)!
            </button>
          </div>
        ) : (
          <div className="w-full" style={{ columns: '160px 2', columnGap: '12px' }}>
            {filtered.map((item, idx) => {
              const url = (item.imageUrls && item.imageUrls.length > 0) ? item.imageUrls[0] : (item.photoUrl || item.url);
              return (
                <div
                  key={item.id || idx}
                  className="relative group rounded-xl overflow-hidden cursor-pointer shadow-sm border border-[#c2c6d4] bg-white mb-3 break-inside-avoid active:scale-95 transition-transform"
                  style={{ display: 'inline-block', width: '100%' }}
                  onClick={() => handleOpenLightbox(idx)}
                >
                  <img src={url} alt={item.description || 'Mess Food'} className="w-full object-cover rounded-xl" />
                  {item.mealType && (
                    <div className="p-2.5 text-[11px] font-bold text-[#003f87] bg-white border-t border-[#c2c6d4] flex justify-between items-center">
                      <span>{item.mealType}</span>
                      <span className="text-[10px] text-[#424752] font-normal">{item.date || 'Today'}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Swipe/Nav Lightbox Overlay */}
      {currentPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md" onClick={() => setLightboxIndex(null)}>
          <div className="relative max-w-2xl w-full bg-white border border-[#c2c6d4] rounded-2xl p-4 overflow-hidden shadow-2xl flex flex-col items-center">
            
            {/* Prev Button */}
            {lightboxIndex > 0 && (
              <button
                onClick={handlePrevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 text-[#003f87] p-3 rounded-full shadow-lg hover:bg-white active:scale-95 transition z-20"
              >
                <span className="material-symbols-outlined text-2xl">chevron_left</span>
              </button>
            )}

            {/* Next Button */}
            {lightboxIndex < filtered.length - 1 && (
              <button
                onClick={handleNextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 text-[#003f87] p-3 rounded-full shadow-lg hover:bg-white active:scale-95 transition z-20"
              >
                <span className="material-symbols-outlined text-2xl">chevron_right</span>
              </button>
            )}

            <img
              src={(currentPhoto.imageUrls && currentPhoto.imageUrls.length > 0) ? currentPhoto.imageUrls[0] : (currentPhoto.photoUrl || currentPhoto.url)}
              alt="Expanded Food"
              className="w-full h-auto max-h-[70vh] object-contain rounded-xl"
            />

            <div className="w-full mt-3 flex justify-between items-center text-xs text-[#191c1d] pt-2 border-t border-[#c2c6d4]">
              <span className="font-bold text-[#003f87]">
                {currentPhoto.mealType} Serving ({lightboxIndex + 1} of {filtered.length})
              </span>
              <button onClick={() => setLightboxIndex(null)} className="px-4 py-2 bg-[#003f87] text-white rounded-lg font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
