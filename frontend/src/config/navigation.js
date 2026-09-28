import {
  LayoutDashboard,
  UtensilsCrossed,
  QrCode,
  MessageSquareWarning,
  Star,
  Vote,
  Bell,
  User,
  Settings,
  ClipboardCheck,
  Trash2,
  TrendingUp,
  Users,
  Store,
  ChefHat,
  ShieldCheck,
  Building2
} from 'lucide-react';

export const studentNavigation = [
  {
    title: 'Overview',
    items: [
      { key: 'dashboard', label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard }
    ]
  },
  {
    title: 'Dining',
    items: [
      { key: 'meals', label: 'Meals', path: '/student/meals', icon: UtensilsCrossed },
      { key: 'dining-pass', label: 'Dining Pass', path: '/student/dining', icon: QrCode }
    ]
  },
  {
    title: 'Community',
    items: [
      { key: 'complaints', label: 'Complaints', path: '/student/complaints', icon: MessageSquareWarning },
      { key: 'feedback', label: 'Feedback', path: '/student/feedback', icon: Star },
      { key: 'polls', label: 'Polls', path: '/student/polls', icon: Vote },
      { key: 'notices', label: 'Notices', path: '/student/notices', icon: Bell }
    ]
  },
  {
    title: 'Account',
    items: [
      { key: 'profile', label: 'Profile', path: '/student/profile', icon: User },
      { key: 'settings', label: 'Settings', path: '/student/settings', icon: Settings }
    ]
  }
];

export const adminNavigation = [
  {
    title: 'Overview',
    items: [
      { key: 'admin-dashboard', label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard }
    ]
  },
  {
    title: 'Operations',
    items: [
      { key: 'attendance', label: 'Attendance', path: '/admin/attendance', icon: ClipboardCheck },
      { key: 'complaints', label: 'Complaints', path: '/admin/complaints', icon: MessageSquareWarning },
      { key: 'quality', label: 'Quality & Feedback', path: '/admin/quality', icon: Star }
    ]
  },
  {
    title: 'Food Management',
    items: [
      { key: 'menu', label: 'Menu Builder', path: '/admin/menu', icon: UtensilsCrossed },
      { key: 'waste', label: 'Waste Tracking', path: '/admin/waste', icon: Trash2 }
    ]
  },
  {
    title: 'Insights',
    items: [
      { key: 'analytics', label: 'Analytics', path: '/admin/analytics', icon: TrendingUp }
    ]
  },
  {
    title: 'Management',
    items: [
      { key: 'students', label: 'Students', path: '/admin/students', icon: Users },
      { key: 'polls', label: 'Polls', path: '/admin/polls', icon: Vote },
      { key: 'notices', label: 'Notices', path: '/admin/notices', icon: Bell },
      { key: 'vendor', label: 'Vendor / SLA', path: '/admin/vendor', icon: Store }
    ]
  },
  {
    title: 'System',
    items: [
      { key: 'settings', label: 'Settings', path: '/admin/settings', icon: Settings }
    ]
  }
];

export function getNavigationSections(role = 'STUDENT') {
  return role?.toUpperCase() === 'ADMIN' ? adminNavigation : studentNavigation;
}

export function getSidebarItems(role = 'STUDENT') {
  const sections = getNavigationSections(role);
  return sections.flatMap((section) => section.items);
}

// Default export for backward compatibility
export const navigationSections = studentNavigation;
export const sidebarItems = getSidebarItems('STUDENT');
