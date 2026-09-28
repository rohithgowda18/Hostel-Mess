import {
  LayoutDashboard,
  UtensilsCrossed,
  Building2,
  Users2,
  QrCode,
  Camera,
  MessageSquareWarning,
  UserCheck,
  User,
  Settings,
  Bell
} from 'lucide-react';

export const navigationSections = [
  {
    title: 'Main Navigation',
    items: [
      { key: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { key: 'meals', label: 'Mess & Meals', path: '/meals', icon: UtensilsCrossed },
      { key: 'directory', label: 'Hostel & Rooms', path: '/directory', icon: Building2 },
      { key: 'groups', label: 'Buddy Groups', path: '/groups', icon: Users2 },
      { key: 'qr-checkin', label: 'QR Check-in', path: '/qr-checkin', icon: QrCode },
      { key: 'student-photos', label: 'Food Gallery', path: '/student-photos', icon: Camera }
    ]
  },
  {
    title: 'Management & Support',
    items: [
      { key: 'feedback', label: 'Feedback & Reports', path: '/feedback', icon: MessageSquareWarning },
    ]
  }
];

export const sidebarItems = [
  ...navigationSections[0].items,
  ...navigationSections[1].items,
  { key: 'profile', label: 'Profile', path: '/profile', icon: User }
];
