# 🍽️ Hostel Mess Live Menu Coordination System

A production-grade, democracy-driven web application built with **Spring Boot** and **React** that allows hostel students to view, coordinate, and update today's food menu for all meal times in real time. It features private coordination groups, feedback voting, chat capabilities, and meal photo uploads.

---

## 📖 Deep-Dive Subsystem Documentation Index

For exhaustive developer guides and specifications on each architecture layer, refer to the following documents in the `docs` folder:

*   💻 **[Frontend Architecture Guide](docs/FRONTEND.md)**: Details on the React + Vite single page application, Radix UI component states, Tailwind CSS variables, theme switching contexts, routing config, and API services integration.
*   ⚙️ **[Backend Service Guide](docs/BACKEND.md)**: Explanations of Spring Boot REST controllers, controller parameters, business logic service beans, schedules for expired records cleanup, and file uploads.
*   🔐 **[Security Design Guide](docs/SECURITY.md)**: Explains the Spring Security filters, stateless session handling, BCrypt hashing mechanism, custom JWT token validation, and CORS configurations.
*   🗄️ **[Database Specifications](docs/DATABASE.md)**: Details on the MongoDB schemas, unique compound indexes, Repository interfaces, and document structure examples.

---

## 🎯 Core Features

- **Live Menu Management**: Displays real-time meal items (Breakfast, Lunch, Snacks, Dinner) with validation badges.
- **Buddy Groups**: Create/join groups with unique 8-character codes to coordinate dining schedules.
- **Group Meal Status**: Signal if you are "going" to a meal with automated 30-minute status expiry.
- **Chat System**: Includes Universal Community Chat (public) and private Group Chat for individual buddy groups.
- **Mess Voice (Complaints)**: Democracy-driven feedback system where students vote (AGREE/DISAGREE) on food quality issues.
- **Student Photo Submissions**: Multi-image photo uploads showing actual mess food items.

---

## 🏗️ Project Architecture

```
hostel-mess/
│
├── backend/
│   ├── pom.xml
│   ├── mvnw
│   ├── mvnw.cmd
│   │
│   └── src/
│       └── main/
│           ├── java/
│           │   └── com/
│           │       └── hostel/
│           │           └── mess/
│           │               │
│           │               ├── HostelMessApplication.java
│           │               │
│           │               ├── config/
│           │               │   ├── SecurityConfig.java
│           │               │   ├── CorsConfig.java
│           │               │   ├── WebSocketConfig.java
│           │               │   └── CleanupScheduler.java
│           │               │
│           │               ├── controller/
│           │               │   ├── AuthController.java
│           │               │   ├── MealController.java
│           │               │   ├── AttendanceController.java
│           │               │   ├── CommunityController.java
│           │               │   ├── UserController.java
│           │               │   ├── AdminController.java
│           │               │   └── NotificationController.java
│           │               │
│           │               ├── service/
│           │               │   ├── AuthService.java
│           │               │   ├── MealService.java
│           │               │   ├── AttendanceService.java
│           │               │   ├── CommunityService.java
│           │               │   ├── UserService.java
│           │               │   ├── AdminService.java
│           │               │   └── NotificationService.java
│           │               │
│           │               ├── repository/
│           │               │   ├── UserRepository.java
│           │               │   ├── MealSubmissionRepository.java
│           │               │   ├── MealPhotoRepository.java
│           │               │   ├── MealAttendanceRepository.java
│           │               │   ├── WeeklyMenuRepository.java
│           │               │   ├── FoodRatingRepository.java
│           │               │   ├── ComplaintRepository.java
│           │               │   ├── GroupRepository.java
│           │               │   ├── ChatMessageRepository.java
│           │               │   └── NotificationRepository.java
│           │               │
│           │               ├── model/
│           │               │   ├── User.java
│           │               │   ├── MealSubmission.java
│           │               │   ├── MealPhoto.java
│           │               │   ├── MealAttendance.java
│           │               │   ├── WeeklyMenu.java
│           │               │   ├── FoodRating.java
│           │               │   ├── Complaint.java
│           │               │   ├── Group.java
│           │               │   ├── ChatMessage.java
│           │               │   └── Notification.java
│           │               │
│           │               ├── security/
│           │               │   ├── JwtAuthenticationFilter.java
│           │               │   ├── JwtService.java
│           │               │   └── CustomUserDetailsService.java
│           │               │
│           │               ├── dto/
│           │               │   ├── LoginRequest.java
│           │               │   ├── RegisterRequest.java
│           │               │   ├── MealReportRequest.java
│           │               │   ├── MealVerificationRequest.java
│           │               │   ├── AttendanceRequest.java
│           │               │   ├── RatingRequest.java
│           │               │   └── ComplaintRequest.java
│           │               │
│           │               └── exception/
│           │                   ├── GlobalExceptionHandler.java
│           │                   ├── ResourceNotFoundException.java
│           │                   └── BadRequestException.java
│           │
│           └── resources/
│               ├── application.properties
│               ├── food-options.json
│               └── static/
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   │
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       │
│       ├── api/
│       │   ├── restClient.js
│       │   └── endpoints.js
│       │
│       ├── context/
│       │   ├── auth-context.jsx
│       │   └── theme-context.jsx
│       │
│       ├── components/
│       │   ├── ui/
│       │   ├── layout/
│       │   ├── meal/
│       │   ├── attendance/
│       │   ├── community/
│       │   └── admin/
│       │
│       ├── pages/
│       │   ├── auth/
│       │   │   └── LoginPage.jsx
│       │   │
│       │   ├── student/
│       │   │   ├── DashboardPage.jsx
│       │   │   ├── MealsPage.jsx
│       │   │   ├── ReportMealPage.jsx
│       │   │   ├── AttendancePage.jsx
│       │   │   ├── FeedbackPage.jsx
│       │   │   ├── ComplaintsPage.jsx
│       │   │   ├── GroupsPage.jsx
│       │   │   ├── GroupDetailsPage.jsx
│       │   │   ├── NoticesPage.jsx
│       │   │   └── ProfilePage.jsx
│       │   │
│       │   └── admin/
│       │       ├── AdminDashboardPage.jsx
│       │       ├── AdminMealsPage.jsx
│       │       ├── AdminMenuPage.jsx
│       │       ├── AdminAttendancePage.jsx
│       │       ├── AdminRatingsPage.jsx
│       │       ├── AdminComplaintsPage.jsx
│       │       ├── AdminAnalyticsPage.jsx
│       │       ├── AdminStudentsPage.jsx
│       │       ├── AdminNoticesPage.jsx
│       │       └── AdminManagementPage.jsx
│       │
│       ├── routes/
│       │   └── AppRoutes.jsx
│       │
│       ├── hooks/
│       ├── utils/
│       ├── constants/
│       └── styles/
│           └── index.css
│
└── README.md
```

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend** | React 18, Vite, TailwindCSS, Radix UI | User Interface |
| **Backend** | Spring Boot 3.2, Java 17+, WebSockets | Server Application |
| **Database** | MongoDB | Document Store |
| **Security** | Spring Security, JJWT, BCrypt | Auth & Encryption |

---

## 📋 Prerequisites

Before running the application, make sure you have:
- **Node.js** (v18 or higher)
- **Java JDK 17** or higher
- **Maven** (3.6+)
- **MongoDB** (running on port `27017`)

---

## 🚀 Getting Started

### 1. Start MongoDB
Ensure MongoDB is running locally on default port `27017`.

### 2. Configure Environment variables
Backend: copy `backend/.env.example` to `backend/.env` (or export `MONGODB_URI`, `JWT_SECRET`).
Frontend local dev needs no `.env` — Vite proxies `/api` to `http://localhost:8080` (see `frontend/vite.config.js`).
For production, set (see `frontend/.env.example`):
```env
VITE_API_BASE=https://<your-backend>/api
```

### 3. Run Backend (Spring Boot)
```bash
cd backend
mvn spring-boot:run
```
The server will run on `http://localhost:8080`.

### 4. Run Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
The dev server will run on `http://localhost:5173` (Vite default, see `frontend/vite.config.js:16`).
Health check: `GET http://localhost:8080/health` → `OK`.
Universal search: `GET /api/search?q=<query>` (auth required) returns `{ meals, groups, complaints, users }`.
