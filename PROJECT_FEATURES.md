# 🚀 Detailed Project Features Documentation

This document provides a comprehensive breakdown of all implemented features within the Hostel Mess Live Menu & Management System.

---

## 🔐 1. Authentication & Role-Based Access Control (RBAC)

The system enforces authentication and authorization rules to distinguish between student activities and administrative operations.

### Key Capabilities:
*   **Dual-Mode Portal**: Clean, modern UI supporting both Login and Student Registration forms.
*   **Student Registration & Sign-Up**: Students create accounts by providing their University Email, Password, Hostel Block, Room Number, Academic Year, and Branch.
*   **Secure Session Logins**: Verifies credentials against BCrypt password hashes stored in MongoDB and returns a signed stateless JWT token (valid for 24 hours).
*   **Automatic Role Allocation**: Assigns the `ADMIN` role if the signup email matches `rohithgowdak18@gmail.com`; otherwise defaults to `STUDENT`.
*   **Stateless Request Interceptor**: The frontend automatically attaches the `Authorization: Bearer <JWT>` header to all outgoing API queries.

---

## 📊 2. Student & Admin Dashboard (Bento Grid)

Centralized hub offering real-time visibility into current mess operations and dining status.

### Key Capabilities:
*   **Announcement Banner**: Top notification banner for special events (e.g. Special Sunday Feast alerts).
*   **Upcoming Meal Countdown Timer**: Live timer counting down hours, minutes, and seconds until the next meal service begins.
*   **Attendance Declaration**: One-tap buttons ("Will Eat" / "Skip") allowing students to declare meal attendance to prevent food waste.
*   **Today's Menu List**: Displays active meal slot items with dietary indicators and ratings.
*   **Quick QR Check-in Card**: Quick-action card for scanning or opening counter check-in.
*   **Mess Occupancy Bar**: Visual gauge showing live mess crowding levels (e.g., 68% Full) from quiet to crowded.

---

## 🍽️ 3. Meals & Menu Management

Comprehensive schedule, menu display, and attendance tracking system across three tabs.

### Key Capabilities:
*   **Today's Meals Tab**: Detailed cards for Breakfast, Lunch, and Dinner with verified badges, dish descriptions, estimated calories (kcal), and direct check-in triggers.
*   **Weekly Menu Schedule Tab**: Responsive weekly matrix table detailing Breakfast, Lunch, and Dinner items for all 7 days with automatic highlighting for the current day.
*   **Meal History & Ratings Tab**: Personal log of past attended/missed meals with star ratings and attendance badges.

---

## 🏢 4. Hostel Directory & Room Occupancy

Directory system for viewing and managing student room allocations and hostel metrics.

### Key Capabilities:
*   **Occupancy Overview Stats**: Real-time counters for Total Students, Occupied Rooms, and Vacancies.
*   **Search & Filter Bar**: Instant search by student name or ID, alongside filter dropdowns for Block (A/B/C/D), Year (1st-4th), and Branch (CS/ME/EE/EC).
*   **Student Profile Cards**: Grid displaying initial avatars, attendance status badges (Present / Away on Leave), Block/Room details, and dietary preference tags.
*   **Add Student Modal**: Admin interface to add student room assignments.
*   **CSV Export**: One-click download of hostel occupancy reports.

---

## 📱 5. QR Code Counter Check-in System

Streamlined digital check-in system for meal entry at mess counters.

### Key Capabilities:
*   **Live Camera Scanner**: Simulated camera viewport with corner framing lines and an animated scanning line effect.
*   **Manual 6-Digit Code Entry**: Fallback code input field when camera scan is unavailable.
*   **Simulation Controls**: Quick testing toggles ("Simulate Success" / "Simulate Failure").
*   **Check-in Status Overlays**: Full-screen modal popups for "Check-in Confirmed" (with time & dietary info) or "Scan Failed" (with retry option).
*   **Daily Status & Recent Logs**: Live summary of today's checked-in meals and history of recent scans.

---

## 👥 6. Buddy Groups & Coordination

Allows students to form private groups to organize dining times and social meals.

### Key Capabilities:
*   **Featured Active Group**: Highlighted view of current group with location details, next meal timer, member avatars, and meal headcount ("Members Going").
*   **WhatsApp Sharing**: Instant share button to send group invites via WhatsApp.
*   **Group Creation & Joining**: Create custom public or private groups or join using an alphanumeric group code.
*   **Group Chat Panel**: Integrated right-side live chat panel with message bubbles, sender labels, timestamp display, and real-time input.
*   **Member Management**: Ownership transfer if the creator leaves and automatic deletion when all members vacate.

---

## 💬 7. Feedback, Ratings & Complaints System

A 4-tab feedback loop for maintaining food quality and resolving student issues.

### Key Capabilities:
*   **Dish Ratings**: Interactive 5-star rating cards for specific dishes with optional text comments.
*   **Complaint Submission**: Structured form with category selection (Food Quality, Hygiene, Staff Behavior, Menu Deviation), meal session tags, description text, and drag-and-drop photo attachment.
*   **My Feedback History**: Tabular view of all user-submitted feedback with status tags (Resolved, Reviewed, Pending).
*   **Admin Moderation Inbox**: Admin view featuring a complaint list inbox, full complaint inspection panel, status updater, and official reply composer.

---

## 🖼️ 8. Community Food Photo Gallery

Visual gallery allowing students to share real photos of daily mess dishes.

### Key Capabilities:
*   **Masonry Grid Layout**: Dynamic column layout displaying student food uploads.
*   **Hover Overlays**: Interactive card overlays showing photo title, upload timestamp, meal type, and like counter.
*   **Filtering**: Quick filter pills for "All Meals", "Breakfast", "Lunch", and "Dinner", along with date pickers.
*   **Drag-and-Drop Upload Modal**: Photo submission modal with image drop zone, caption input, and meal category selectors.
*   **Interactive Lightbox**: Full-screen photo viewer with contributor details, likes counter, and share action.

---

## 👤 9. Profile & Account Settings

User profile management and hostel settings page.

### Key Capabilities:
*   **Profile Card & Banner**: Avatar display with initial badge, cover background, student ID, and profile editing mode.
*   **Hostel Details Card**: Overview of Block, Room number, and active Meal Plan.
*   **Favorite Dishes Grid**: Manage preferred food items with color tags and add controls.
*   **Account Settings Navigation**: Shortcuts for Privacy Settings, Notification Preferences, and Password Changes.
*   **Logout Trigger**: One-tap logout clearing local JWT tokens and user context.

---

## ⚡ 10. Service Worker & Offline Capability

PWA infrastructure ensuring reliable client performance.

### Key Capabilities:
*   **Pre-cached Static Assets**: Caches static assets (`/index.html`, `/manifest.json`, icons) for fast loading.
*   **Method Guarding**: Strictly bypasses caching for `POST`, `PUT`, and `DELETE` requests to avoid Cache API unsupported method errors.
*   **SPA Route Fallback**: Network-first handler for navigation requests ensuring offline access to `/index.html` without intercepting `/login` or dynamic routes.
