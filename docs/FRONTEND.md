# 💻 Frontend Subsystem Documentation (Deep Dive)

The frontend is a modern Single Page Application (SPA) structured around **React 18** and built using **Vite**. This document provides a highly detailed guide to the UI/UX architecture, component hierarchy, client-side routing, state management, styling paradigms, and API services.

---

## 🏗️ Technical Stack & Configuration

The application is scaffolded using `Vite`, enabling fast Hot Module Replacement (HMR) and optimized build bundles. 

### Core Dependencies (from `package.json`):
- `react` / `react-dom` (`^18.2.0`): Declarative component system.
- `react-router-dom` (`^6.20.0`): Handles declarations of routes and protected page redirection.
- `axios` (`^1.6.2`): HTTP client used to interface with Spring Boot backend services.
- `lucide-react` (`^0.543.0`): Premium vector icon elements.
- `@radix-ui/*`: Unstyled, accessible primitives (Avatar, Dialog, Dropdown Menu, Tabs) used for modal interactions.

### Vite Config (`vite.config.js`):
Uses `@vitejs/plugin-react-swc` for fast compiler performance and path mapping:
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src') // Enables clean imports e.g., '@/components/ui'
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
});
```

---

## 📂 Source Code & Directory Layout

The application code resides under the `src/` folder:

```
src/
├── components/
│   ├── daily-meal/
│   ├── dashboard/
│   ├── layout/
│   │   ├── app-sidebar.jsx             # Left sidebar navigation links
│   │   └── top-navbar.jsx              # Header with search & user status
│   └── ui/                             # Radix custom styling primitives
├── config/
│   ├── navigation.js                   # Configuration object for sidebar links (includes QR check-in)
│   └── student-photos-sidebar-item.js  # Photo gallery routing configs
├── pages/
│   ├── dashboard-page.jsx              # Main dashboard bento grid view
│   ├── directory-page.jsx              # Hostel directory & room occupancy
│   ├── feedback-page.jsx               # Ratings, complaints & admin inbox
│   ├── groups-page.jsx                 # Buddy groups list & chat panel
│   ├── group-detail-page.jsx           # Single group details view
│   ├── login-page.jsx                  # Login & registration forms
│   ├── meals-page.jsx                  # Today's menu, weekly menu & meal history
│   ├── profile-page.jsx                # Profile, hostel info & account settings
│   ├── qr-checkin-page.jsx             # Scanner camera view & manual code entry
│   └── student-food-photos-page.jsx    # Community food photo gallery & lightbox
├── services/
│   ├── api-client.js                   # Axios base client with auth interceptor
│   ├── auth-service.js                 # Auth token, login & registration storage helpers
│   └── mess-api.js                     # Centralized API service methods mapping to backend endpoints
├── App.jsx                             # Main routing switcher
├── main.jsx                            # React bootstrap file
└── index.css                           # Root CSS styles and Tailwind configurations
```

---

## ⚡ Service Worker & Offline PWA (`public/service-worker.js`)

A custom Service Worker provides offline capabilities and caching:
- **PWA Assets**: Pre-caches static shell assets (`/index.html`, `/manifest.json`, icons) on install.
- **HTTP Method Guard**: Strictly filters `req.method === 'GET'`. All non-GET requests (`POST`, `PUT`, `DELETE`) pass through un-cached directly to network to prevent Cache API errors.
- **SPA Routing Support**: Uses `req.mode === 'navigate'` network-first handling to allow offline fallback to `/index.html` without breaking `/login` or dynamic routes.
- **API Requests**: Network-first strategy for `/api/` endpoints ensuring real-time data integrity.

---

## 🧭 Page Views & State Handling

### 1. `App.jsx` Routing & Protection
Controls authentication state and protects private application routes:
```jsx
<Routes>
  <Route path="/login" element={authenticated ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={handleLogin} />} />
  <Route path="/dashboard" element={authenticated ? <DashboardLayout user={appUser}><DashboardPage /></DashboardLayout> : <Navigate to="/login" replace />} />
  <Route path="/meals" element={authenticated ? <DashboardLayout user={appUser}><MealsPage /></DashboardLayout> : <Navigate to="/login" replace />} />
  <Route path="/directory" element={authenticated ? <DashboardLayout user={appUser}><DirectoryPage /></DashboardLayout> : <Navigate to="/login" replace />} />
  <Route path="/student-photos" element={authenticated ? <DashboardLayout user={appUser}><StudentFoodPhotosPage /></DashboardLayout> : <Navigate to="/login" replace />} />
  <Route path="/groups" element={authenticated ? <DashboardLayout user={appUser}><GroupsPage /></DashboardLayout> : <Navigate to="/login" replace />} />
  <Route path="/feedback" element={authenticated ? <DashboardLayout user={appUser}><FeedbackPage /></DashboardLayout> : <Navigate to="/login" replace />} />
  <Route path="/qr-checkin" element={authenticated ? <DashboardLayout user={appUser}><QrCheckinPage /></DashboardLayout> : <Navigate to="/login" replace />} />
  <Route path="/profile" element={authenticated ? <DashboardLayout user={appUser}><ProfilePage /></DashboardLayout> : <Navigate to="/login" replace />} />
</Routes>
```

### 2. Implemented Page Subsystems
- **LoginPage**: Dual-mode (Login / Register). Register payload maps to backend `RegisterRequest` DTO (`email`, `password`, `hostel`, `roomNumber`, `year`, `branch`).
- **DashboardPage**: 3-column bento grid, announcement banner, next meal countdown timer, attendance declaration controls, and live mess occupancy status.
- **MealsPage**: 3-tab system showing Today's Meals (with kcal & check-in buttons), Weekly Menu schedule matrix, and personal Meal History ratings/attendance badges.
- **DirectoryPage**: Hostel directory occupancy metrics (total, occupied, vacancies), search and filtering by block/year/branch, student detail cards, and Add Student modal.
- **FeedbackPage**: 4-tab interface including dish rating cards with star selectors, complaint submission with image upload area, personal feedback history, and an Admin Moderation inbox panel.
- **QrCheckinPage**: Real-time simulated camera scanner with animated scan frame, manual 6-digit code entry, today's meal status check, and full-screen check-in result overlays.
- **GroupsPage**: Featured active buddy group card with meal countdown, other public/private groups grid, right-side live group chat panel, and group creation modal.
- **StudentFoodPhotosPage**: Masonry community food photo gallery, meal type & date filtering, drag-and-drop upload modal, and full-screen image lightbox modal.
- **ProfilePage**: Student cover banner & avatar, editable personal details, hostel room info, favorite dish management grid, account settings menu, and logout triggers.

---

## 📡 API Layer Integration (`src/services/`)

### Axios Base Interceptor (`api-client.js`)
Configures a centralized Axios client. It dynamically appends the authentication header:
```javascript
import axios from 'axios';
import { API_BASE_URL, getAuthHeader } from '@/services/auth-service';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use((config) => {
  const authHeader = getAuthHeader();
  if (authHeader.Authorization) {
    config.headers.Authorization = authHeader.Authorization;
  }
  return config;
});

export default apiClient;
```

### Mess Endpoints Wrapper (`mess-api.js`)
Provides declarative methods mapping to Spring Boot controller paths:
- `getTodayMeal(mealType)` / `getAllTodayMeals(mealTypes)`: Fetches current daily meal slots.
- `setExpectedAttendance(mealType, date, expected)` / `getMyAttendanceStatus(...)`: Meal declaration management.
- `checkInQR(mealType, date, code)`: QR code verification and counter check-in.
- `createGroup(name)` / `joinGroup(code)` / `leaveGroup(id)`: Buddy group management.
- `markGroupMealGoing(groupId, mealType)` / `cancelGroupMealGoing(...)`: Group attendance status.
- `getMessages(chatType, chatId)` / `sendMessage(...)`: Real-time chat messaging.
- `raiseComplaint(payload)` / `voteOnComplaint(id, vote)`: Community complaint system.
- `submitMealRating(rating)` / `getMealRatingsSummary(...)`: Dish ratings and feedback.
- `getDirectoryTree()` / `searchDirectory(params)` / `getOccupancyStats()`: Hostel room directory and admin metrics.
- `getAnnouncements()` / `getWeeklyMenu(startDate)` / `getFavorites()`: General portal data feeds.
