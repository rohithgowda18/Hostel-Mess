import { DoorOpen, Users, Bed, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function RoomCard({
  roomNumber,
  block,
  floor,
  capacity = 2,
  occupancy = 0,
  occupants = [],
  roomType = 'Standard Sharing',
  status, // 'available' | 'full' | 'maintenance'
  onViewDetails,
  onAssign,
  isAdmin = false,
  className
}) {
  const currentOccupancy = Math.min(occupancy, capacity);
  const isFull = currentOccupancy >= capacity;
  const isAvailable = currentOccupancy < capacity;
  const computedStatus = status || (isFull ? 'full' : 'available');

  return (
    <div
      className={cn(
        'group relative flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-xs transition-colors hover:border-teal-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-500',
        className
      )}
    >
      <div>
        {/* Header: Room Number & Status Badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400 border border-teal-100 dark:border-teal-900/40">
              <DoorOpen className="h-4.5 w-4.5" />
            </div>
            <div>
              <h4 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Room {roomNumber}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {block} {floor ? `· Floor ${floor}` : ''}
              </p>
            </div>
          </div>

          <Badge
            variant={computedStatus === 'full' ? 'warning' : computedStatus === 'available' ? 'success' : 'danger'}
          >
            {computedStatus === 'full' ? 'Full' : computedStatus === 'available' ? `${capacity - currentOccupancy} Vacant` : 'Reserved'}
          </Badge>
        </div>

        {/* Occupancy Progress & Visual Dots */}
        <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 mb-4">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> Occupancy
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {currentOccupancy} / {capacity} Beds
            </span>
          </div>

          {/* Dots Indicator: ● ● ● ○ */}
          <div className="flex items-center gap-2">
            {Array.from({ length: capacity }).map((_, idx) => {
              const isFilled = idx < currentOccupancy;
              return (
                <div
                  key={idx}
                  title={isFilled ? 'Occupied bed' : 'Available bed'}
                  className={cn(
                    'h-2.5 flex-1 rounded-full transition-all duration-300',
                    isFilled
                      ? 'bg-blue-600 dark:bg-blue-500 shadow-xs'
                      : 'bg-slate-200 dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700'
                  )}
                />
              );
            })}
          </div>

          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {roomType}
          </div>
        </div>

        {/* Roommates / Occupants Preview */}
        {occupants && occupants.length > 0 ? (
          <div className="mb-4 space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Current Occupants
            </span>
            <div className="flex flex-wrap gap-1.5">
              {occupants.slice(0, 3).map((occ, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300 truncate max-w-[150px]"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {typeof occ === 'string' ? occ.split('@')[0] : occ.name || occ.email?.split('@')[0]}
                </span>
              ))}
              {occupants.length > 3 && (
                <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-500 dark:bg-slate-800">
                  +{occupants.length - 3} more
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="mb-4 py-1 text-xs text-slate-400 italic">
            Currently vacant room
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs font-semibold"
          onClick={onViewDetails}
        >
          View Details
        </Button>
        {isAdmin && isAvailable && onAssign && (
          <Button
            variant="default"
            size="sm"
            className="text-xs font-semibold px-3"
            onClick={onAssign}
          >
            Assign
          </Button>
        )}
      </div>
    </div>
  );
}

export default RoomCard;
