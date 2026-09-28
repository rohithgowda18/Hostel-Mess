/**
 * Single consistent source of truth for University Hostel Mess meal service windows.
 * Section 6:
 * Breakfast: 07:30–09:30
 * Lunch:     12:30–14:30
 * Snacks:    16:30–17:30
 * Dinner:    19:30–21:30
 */

export const MEAL_SLOTS = {
  BREAKFAST: {
    type: 'BREAKFAST',
    label: 'Breakfast',
    start: '07:30',
    end: '09:30',
    startHour: 7,
    startMinute: 30,
    endHour: 9,
    endMinute: 30
  },
  LUNCH: {
    type: 'LUNCH',
    label: 'Lunch',
    start: '12:30',
    end: '14:30',
    startHour: 12,
    startMinute: 30,
    endHour: 14,
    endMinute: 30
  },
  SNACKS: {
    type: 'SNACKS',
    label: 'Snacks',
    start: '16:30',
    end: '17:30',
    startHour: 16,
    startMinute: 30,
    endHour: 17,
    endMinute: 30
  },
  DINNER: {
    type: 'DINNER',
    label: 'Dinner',
    start: '19:30',
    end: '21:30',
    startHour: 19,
    startMinute: 30,
    endHour: 21,
    endMinute: 30
  }
};

/**
 * Returns formatted time label, e.g. "07:30 – 09:30"
 */
export function getSlotTimeLabel(slot) {
  if (!slot) return '';
  return `${slot.start} – ${slot.end}`;
}

/**
 * Checks whether a given slot is active at the current moment
 */
export function isSlotActive(slot, date = new Date()) {
  if (!slot) return false;
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const startMinutes = slot.startHour * 60 + slot.startMinute;
  const endMinutes = slot.endHour * 60 + slot.endMinute;
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/**
 * Returns the currently active slot key ('BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'),
 * or if no slot is active, returns the next upcoming meal slot.
 */
export function getCurrentMealSlot(date = new Date()) {
  const currentMinutes = date.getHours() * 60 + date.getMinutes();

  for (const [key, slot] of Object.entries(MEAL_SLOTS)) {
    const startMinutes = slot.startHour * 60 + slot.startMinute;
    const endMinutes = slot.endHour * 60 + slot.endMinute;
    if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
      return key;
    }
  }

  // If outside all active slots, determine next upcoming slot
  if (currentMinutes < MEAL_SLOTS.BREAKFAST.startHour * 60 + MEAL_SLOTS.BREAKFAST.startMinute) {
    return 'BREAKFAST';
  }
  if (currentMinutes < MEAL_SLOTS.LUNCH.startHour * 60 + MEAL_SLOTS.LUNCH.startMinute) {
    return 'LUNCH';
  }
  if (currentMinutes < MEAL_SLOTS.SNACKS.startHour * 60 + MEAL_SLOTS.SNACKS.startMinute) {
    return 'SNACKS';
  }
  if (currentMinutes < MEAL_SLOTS.DINNER.startHour * 60 + MEAL_SLOTS.DINNER.startMinute) {
    return 'DINNER';
  }

  // After dinner -> next day's breakfast
  return 'BREAKFAST';
}

/**
 * Calculates remaining seconds in an active slot, or 0 if inactive
 */
export function getRemainingSlotSeconds(slot, date = new Date()) {
  if (!isSlotActive(slot, date)) return 0;
  const end = new Date(date);
  end.setHours(slot.endHour, slot.endMinute, 0, 0);
  return Math.max(0, Math.floor((end.getTime() - date.getTime()) / 1000));
}
