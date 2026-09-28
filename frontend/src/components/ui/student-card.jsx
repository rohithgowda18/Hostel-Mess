import { User, MapPin, GraduationCap, Phone, Mail, Building } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function StudentCard({
  name,
  studentId,
  hostel,
  block,
  room,
  branch,
  year,
  roomType,
  status = 'present',
  initials,
  onClick,
  className
}) {
  const displayInitials =
    initials ||
    (name || studentId || 'ST')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className={cn(
        'group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 text-left shadow-xs transition-all duration-200 hover:shadow-card-hover hover:border-blue-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500 cursor-pointer active:scale-[0.99]',
        className
      )}
    >
      <div>
        {/* Header: Avatar, Name & Status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-sm shadow-xs">
              {displayInitials}
            </div>
            <div className="min-w-0">
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                {studentId}
              </p>
            </div>
          </div>

          <Badge variant={status === 'present' ? 'success' : 'neutral'}>
            <span className={cn('h-1.5 w-1.5 rounded-full', status === 'present' ? 'bg-emerald-500' : 'bg-slate-400')} />
            {status === 'present' ? 'Resident' : 'Vacated'}
          </Badge>
        </div>

        {/* Hostel & Room Location Box */}
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 mb-3 space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <Building className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="truncate">{hostel || block}</span>
            <span className="text-slate-400">·</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold shrink-0">Room {room}</span>
          </div>
          {roomType && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-5 truncate">
              {roomType}
            </p>
          )}
        </div>

        {/* Academic Info */}
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <GraduationCap className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{branch}</span>
          {year && <span className="shrink-0 text-slate-400 font-medium">({year} Year)</span>}
        </div>
      </div>

      {/* Footer hint */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-blue-600 dark:text-blue-400">
        <span>View Full Profile</span>
        <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-0.5">arrow_forward</span>
      </div>
    </div>
  );
}

export default StudentCard;
