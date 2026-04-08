
# 🚀 Project Features

This document provides a comprehensive overview of all features in the Hostel Mess Live Menu project, including detailed descriptions and user benefits.

## Core Features

### 1. View Today's Menu
**Description:**
Users can instantly view the current food items being served for each meal (Breakfast, Lunch, Snacks, Dinner) on the same day. The menu is always up to date, reflecting the latest changes made by any user.
**Benefits:**
- No more confusion about what’s being served
- Everyone sees the same, real-time menu

### 2. Post Menu Updates
**Description:**
Authorized users can select food items from a predefined list (with images) and post the current menu for any meal. If a menu is posted again for the same meal and day, it overwrites the previous one, ensuring only the latest menu is visible.
**Benefits:**
- Easy for mess staff or student reps to update the menu
- Prevents outdated or duplicate menu entries

### 3. Visual Food Selection
**Description:**
Food items are presented as image cards, making it easy to recognize and select dishes. Users can add or remove items with a single click, and custom food items can be added if needed.
**Benefits:**
- Reduces errors in menu selection
- Makes the interface engaging and user-friendly

### 4. Meal Type Tabs
**Description:**
Tabs for Breakfast, Lunch, Snacks, and Dinner allow users to quickly switch between meal types and see or update the menu for each.
**Benefits:**
- Fast navigation
- Clear separation of meal times

### 5. Responsive Design
**Description:**
The application is fully responsive, adapting its layout for desktops, tablets, and mobile devices. All features remain accessible and visually appealing on any screen size.
**Benefits:**
- Usable from hostel rooms, mess halls, or on the go
- No need for a separate mobile app

### 6. Real-time Updates
**Description:**
When a menu is updated, all connected users see the changes instantly without needing to refresh the page. This is achieved using real-time technologies (e.g., WebSockets or polling).
**Benefits:**
- Everyone stays in sync
- Reduces miscommunication

## Backend Features

### 1. RESTful API
**Description:**
The backend exposes RESTful endpoints for all core operations, including fetching today’s menu, posting updates, and retrieving menu history. All data is validated and errors are handled gracefully.
**Endpoints:**
- `GET /api/meals/today/{mealType}`: Fetch today’s menu for a meal type
- `POST /api/meals/update`: Update today’s menu for a meal
**Benefits:**
- Easy integration with other systems or mobile apps
- Consistent and predictable API design

### 2. MongoDB Integration
**Description:**
Menu data is stored in MongoDB, with one document per meal type and date. If a menu is posted again for the same meal and date, the document is updated (not duplicated).
**Schema Example:**
```
{
  "mealType": "BREAKFAST",
  "date": "YYYY-MM-DD",
  "items": ["Idli", "Vada"],
  "postedAt": "ISO_TIMESTAMP"
}
```
**Benefits:**
- Efficient storage and retrieval
- Prevents duplicate menu entries

## Planned/Future Features

### 1. User Authentication for Posting Menus
Only authorized users (e.g., mess staff, student reps) can update the menu. Others can only view.

### 2. Food Rating and Feedback System
Allow students to rate food items and leave feedback, helping improve food quality.

### 3. Admin Panel for Menu Management
Admins can manage users, view menu history, and moderate feedback.

### 4. Support for Multiple Hostels
Enable the system to handle menus for several hostels within the same app.

### 5. Push Notifications for Menu Updates
Notify users instantly when a new menu is posted.

### 6. Historical Menu Analytics
View trends, most popular dishes, and menu changes over time.

---

For more details, see the main README.md.
