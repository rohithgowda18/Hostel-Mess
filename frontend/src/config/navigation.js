import {
  CalendarDays,
  LayoutDashboard,
  MessageSquareWarning,
  UserRound,
  Users,
  Vote,
  BarChart3,
  History,
  QrCode,
  Home
} from 'lucide-react';

import { STUDENT_PHOTOS_SIDEBAR_ITEM } from './student-photos-sidebar-item';

export const sidebarItems = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'meals', label: 'Meals', icon: CalendarDays },
  { key: 'directory', label: 'Hostel Directory', icon: Home },
  STUDENT_PHOTOS_SIDEBAR_ITEM,
  { key: 'groups', label: 'Groups', icon: Users },
  { key: 'feedback', label: 'Feedback', icon: MessageSquareWarning },
  { key: 'qr-checkin', label: 'QR Check-in', icon: QrCode },
  { key: 'profile', label: 'Profile', icon: UserRound }
];

