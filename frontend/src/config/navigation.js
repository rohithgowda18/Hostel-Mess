import {
  AlertCircle,
  CalendarDays,
  Heart,
  LayoutDashboard,
  MessageSquareWarning,
  MessagesSquare,
  UserRound,
  Users,
  Vote
} from 'lucide-react';

export const sidebarItems = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'daily-meal', label: 'Daily Meal', icon: CalendarDays },
  { key: 'groups', label: 'Groups', icon: Users },
  { key: 'complaints', label: 'Complaints', icon: AlertCircle },
  { key: 'lost-found', label: 'Lost & Found', icon: Heart },
  { key: 'roommates', label: 'Roommates', icon: UserRound },
  { key: 'community-chat', label: 'Community Chat', icon: MessagesSquare },
  { key: 'profile', label: 'Profile', icon: UserRound },
  { key: 'post-food', label: 'Post Food', icon: CalendarDays },
  { key: 'voting', label: 'Voting', icon: CalendarDays }
];
