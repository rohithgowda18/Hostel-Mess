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
    title: 'Primary',
    items: [
      { key: 'dashboard', label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
      { key: 'meals', label: 'Meals', path: '/student/meals', icon: UtensilsCrossed },
      { key: 'report-meal', label: 'Report Meal', path: '/student/report-meal', icon: Sparkles, isAction: true },
      { key: 'attendance', label: 'Attendance', path: '/student/attendance', icon: QrCode }
    ]
  },
  {
    title: 'Community',
    items: [
      { key: 'groups', label: 'Groups', path: '/student/groups', icon: Users },
      { key: 'complaints', label: 'Complaints', path: '/student/complaints', icon: MessageSquareWarning }
    ]
  },
  {
    title: 'Other',
    items: [
      { key: 'notices', label: 'Notifications', path: '/student/notices', icon: Bell }
    ]
  }
];

export const studentMobileNav = [
  { key: 'home', label: 'Home', path: '/student/dashboard', icon: LayoutDashboard },
  { key: 'meals', label: 'Meals', path: '/student/meals', icon: UtensilsCrossed },
  { key: 'report', label: 'Report', path: '/student/report-meal', icon: Sparkles, isHero: true },
  { key: 'attendance', label: 'Attendance', path: '/student/attendance', icon: QrCode },
  { key: 'groups', label: 'Groups', path: '/student/groups', icon: Users },
  { key: 'complaints', label: 'Complaints', path: '/student/complaints', icon: MessageSquareWarning },
  { key: 'notifications', label: 'Notifications', path: '/student/notices', icon: Bell }
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
