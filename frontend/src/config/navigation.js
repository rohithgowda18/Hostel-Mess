import {
  CalendarDays,
  LayoutDashboard,
  MessageSquareWarning,
  MessagesSquare,
  UserRound,
  Users,
  Vote
} from 'lucide-react';

import { STUDENT_PHOTOS_SIDEBAR_ITEM } from './student-photos-sidebar-item';

export const sidebarItems = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'weekly-menu', label: 'Daily Meal', icon: CalendarDays },
  STUDENT_PHOTOS_SIDEBAR_ITEM,
  { key: 'groups', label: 'Groups', icon: Users },
  { key: 'voting', label: 'Voting', icon: Vote },
  { key: 'feedback', label: 'Feedback', icon: MessageSquareWarning },
  { key: 'community-chat', label: 'Community Chat', icon: MessagesSquare },
  { key: 'profile', label: 'Profile', icon: UserRound }
];
