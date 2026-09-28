import {
  LayoutDashboard,
  UtensilsCrossed,
  Sparkles,
  QrCode,
  Star,
  MessageSquareWarning,
  Users,
  Bell,
  User,
  ShieldCheck,
  ClipboardCheck,
  TrendingUp,
  SlidersHorizontal,
  Calendar
} from 'lucide-react';

export const studentNavigation = [
  {
    title: 'Dining & Service',
    items: [
      { key: 'dashboard', label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
      { key: 'meals', label: 'Meals & Menu', path: '/student/meals', icon: UtensilsCrossed },
      { key: 'report-meal', label: 'Report Meal', path: '/student/report-meal', icon: Sparkles, badge: 'Live' },
      { key: 'attendance', label: 'Attendance / Pass', path: '/student/attendance', icon: QrCode }
    ]
  },
  {
    title: 'Community',
    items: [
      { key: 'feedback', label: 'Rate Meal', path: '/student/feedback', icon: Star },
      { key: 'complaints', label: 'Complaints', path: '/student/complaints', icon: MessageSquareWarning },
      { key: 'groups', label: 'Groups & Chat', path: '/student/groups', icon: Users },
      { key: 'notices', label: 'Notices', path: '/student/notices', icon: Bell }
    ]
  }
];

export const studentMobileNav = [
  { key: 'home', label: 'Home', path: '/student/dashboard', icon: LayoutDashboard },
  { key: 'meals', label: 'Meals', path: '/student/meals', icon: UtensilsCrossed },
  { key: 'report', label: 'Report', path: '/student/report-meal', icon: Sparkles, isHero: true },
  { key: 'community', label: 'Groups', path: '/student/groups', icon: Users },
  { key: 'profile', label: 'Profile', path: '/student/profile', icon: User }
];

export const adminNavigation = [
  {
    title: 'Operations',
    items: [
      { key: 'admin-dashboard', label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
      { key: 'admin-meals', label: 'Live Meal Operations', path: '/admin/meals', icon: Sparkles },
      { key: 'admin-menu', label: 'Weekly Menu', path: '/admin/menu', icon: Calendar },
      { key: 'admin-attendance', label: 'Attendance', path: '/admin/attendance', icon: ClipboardCheck }
    ]
  },
  {
    title: 'Quality & Governance',
    items: [
      { key: 'admin-ratings', label: 'Ratings / Quality', path: '/admin/ratings', icon: Star },
      { key: 'admin-complaints', label: 'Complaints', path: '/admin/complaints', icon: MessageSquareWarning },
      { key: 'admin-analytics', label: 'Analytics', path: '/admin/analytics', icon: TrendingUp },
      { key: 'admin-students', label: 'Students', path: '/admin/students', icon: Users },
      { key: 'admin-notices', label: 'Notices', path: '/admin/notices', icon: Bell },
      { key: 'admin-management', label: 'Admin Management', path: '/admin/management', icon: ShieldCheck }
    ]
  }
];

export const adminMobileNav = [
  { key: 'admin-dashboard', label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { key: 'admin-meals', label: 'Live Ops', path: '/admin/meals', icon: Sparkles },
  { key: 'admin-menu', label: 'Menu', path: '/admin/menu', icon: Calendar },
  { key: 'admin-complaints', label: 'Issues', path: '/admin/complaints', icon: MessageSquareWarning }
];

export function getNavigationSections(role = 'STUDENT') {
  return role?.toUpperCase() === 'ADMIN' ? adminNavigation : studentNavigation;
}

export function getSidebarItems(role = 'STUDENT') {
  const sections = getNavigationSections(role);
  return sections.flatMap((section) => section.items);
}

export const navigationSections = studentNavigation;
export const sidebarItems = getSidebarItems('STUDENT');
