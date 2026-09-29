// Utility for hostel mess dining time windows and live schedule calculations
export const MEAL_WINDOWS = [
  {
    key: 'BREAKFAST',
    name: 'Breakfast',
    time: '07:30 – 09:30',
    startHour: 7,
    startMinute: 30,
    endHour: 9,
    endMinute: 30,
    startMinutes: 7 * 60 + 30, // 450
    endMinutes: 9 * 60 + 30,   // 570
    icon: 'free_breakfast'
  },
  {
    key: 'LUNCH',
    name: 'Lunch',
    time: '12:30 – 14:30',
    startHour: 12,
    startMinute: 30,
    endHour: 14,
    endMinute: 30,
    startMinutes: 12 * 60 + 30, // 750
    endMinutes: 14 * 60 + 30,   // 870
    icon: 'lunch_dining'
  },
  {
    key: 'SNACKS',
    name: 'Snacks',
    time: '16:30 – 17:30',
    startHour: 16,
    startMinute: 30,
    endHour: 17,
    endMinute: 30,
    startMinutes: 16 * 60 + 30, // 990
    endMinutes: 17 * 60 + 30,   // 1050
    icon: 'bakery_dining'
  },
  {
    key: 'DINNER',
    name: 'Dinner',
    time: '19:30 – 21:30',
    startHour: 19,
    startMinute: 30,
    endHour: 21,
    endMinute: 30,
    startMinutes: 19 * 60 + 30, // 1170
    endMinutes: 21 * 60 + 30,   // 1290
    icon: 'dinner_dining'
  }
];

export function getMealTimeStatus(serverOffset = 0) {
  const now = new Date(Date.now() + serverOffset);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentSecondsInDay = currentMinutes * 60 + now.getSeconds();

  let activeSlot = null;
  let nextSlot = null;
  let lastCompletedSlot = null;

  for (let i = 0; i < MEAL_WINDOWS.length; i++) {
    const slot = MEAL_WINDOWS[i];
    if (currentMinutes >= slot.startMinutes && currentMinutes < slot.endMinutes) {
      activeSlot = slot;
      nextSlot = MEAL_WINDOWS[(i + 1) % MEAL_WINDOWS.length];
      break;
    }
  }

  if (!activeSlot) {
    for (let i = 0; i < MEAL_WINDOWS.length; i++) {
      const slot = MEAL_WINDOWS[i];
      if (currentMinutes < slot.startMinutes) {
        nextSlot = slot;
        break;
      }
      lastCompletedSlot = slot;
    }
    if (!nextSlot) {
      nextSlot = MEAL_WINDOWS[0]; // Tomorrow's Breakfast
      lastCompletedSlot = MEAL_WINDOWS[MEAL_WINDOWS.length - 1];
    }
  }

  let remainingSeconds = 0;
  if (activeSlot) {
    const endSeconds = activeSlot.endMinutes * 60;
    remainingSeconds = Math.max(0, endSeconds - currentSecondsInDay);
  }

  const timeline = MEAL_WINDOWS.map((slot) => {
    let status = 'upcoming'; // 'completed' | 'serving' | 'upcoming'
    if (currentMinutes >= slot.endMinutes) {
      status = 'completed';
    } else if (currentMinutes >= slot.startMinutes && currentMinutes < slot.endMinutes) {
      status = 'serving';
    } else {
      status = 'upcoming';
    }
    return {
      ...slot,
      status
    };
  });

  return {
    isActive: Boolean(activeSlot),
    activeSlot,
    nextSlot,
    lastCompletedSlot,
    remainingSeconds,
    timeline,
    currentTimeStr: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
}

export function formatCountdown(totalSecs) {
  const safeSecs = Math.max(0, Math.floor(totalSecs));
  const h = Math.floor(safeSecs / 3600);
  const m = Math.floor((safeSecs % 3600) / 60);
  const s = safeSecs % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
