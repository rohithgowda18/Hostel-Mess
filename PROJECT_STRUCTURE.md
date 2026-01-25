# 📁 Project Structure - Complete Overview

**Generated**: January 25, 2026  
**Project**: Hostel Mess Live Menu System  
**Status**: ✅ Production Ready

---

## 🗂️ Directory Tree

```
Mess/
├── 📄 README.md                          (Project overview)
├── 📄 COMPLETE_SYSTEM_GUIDE.md           (Comprehensive documentation)
├── 📄 PROJECT_STRUCTURE.md               (This file)
│
├── frontend/                              (React 18+ Frontend)
│   ├── package.json                      (NPM dependencies)
│   ├── package-lock.json
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── index.js                      (Entry point)
│   │   ├── index.css
│   │   ├── App.js                        (Main router)
│   │   ├── App.css
│   │   │
│   │   ├── services/                     (API & Auth)
│   │   │   ├── api.js                    ⭐ Main API with JWT interceptor
│   │   │   ├── authService.js            ⭐ Token & user management
│   │   │   ├── complaints.js             ⭐ Complaints API
│   │   │   └── groupApi.js               (Group management)
│   │   │
│   │   ├── components/                   (React Components)
│   │   │   ├── App Layout
│   │   │   │   ├── Login.js
│   │   │   │   ├── Register.js
│   │   │   │   ├── ProtectedRoute.js     (Auth check)
│   │   │   │   │
│   │   │   ├── Dashboard Components
│   │   │   │   ├── MealTabs.js           (Meal type selector)
│   │   │   │   ├── MealTabs.css
│   │   │   │   ├── FoodGrid.js           (Food items list)
│   │   │   │   ├── FoodGrid.css
│   │   │   │   ├── FoodCard.js           (Individual food item)
│   │   │   │   ├── FoodCard.css
│   │   │   │   ├── TodayMenuDisplay.js   (Current meal display)
│   │   │   │   ├── TodayMenuDisplay.css
│   │   │   │   │
│   │   │   ├── Group Components
│   │   │   │   ├── GroupDashboard.js     (Groups overview)
│   │   │   │   ├── GroupDashboard.css
│   │   │   │   ├── CreateGroup.js        (New group form)
│   │   │   │   ├── CreateGroup.css
│   │   │   │   ├── JoinGroup.js          (Join via code)
│   │   │   │   ├── JoinGroup.css
│   │   │   │   ├── GroupCodeShare.js     (Share group code)
│   │   │   │   ├── GroupCodeShare.css
│   │   │   │   ├── GroupStatusList.js    (Members & status)
│   │   │   │   ├── GroupStatusList.css
│   │   │   │   ├── MealGoingButton.js    (Going status toggle)
│   │   │   │   ├── MealGoingButton.css
│   │   │   │   │
│   │   │   ├── Chat Components
│   │   │   │   ├── ChatWindow.js         (Message container)
│   │   │   │   ├── ChatWindow.css
│   │   │   │   ├── MessageBubble.js      (Individual message)
│   │   │   │   ├── MessageBubble.css
│   │   │   │   ├── MessageInput.js       (Message form)
│   │   │   │   ├── MessageInput.css
│   │   │   │   ├── UniversalChatPage.js  (Community chat)
│   │   │   │   ├── UniversalChatPage.css
│   │   │   │   ├── GroupChatPage.js      (Group chat)
│   │   │   │   ├── GroupChatPage.css
│   │   │   │   │
│   │   │   ├── Complaint Components
│   │   │   │   ├── MessVoice.js          (Complaints interface)
│   │   │   │   ├── MessVoice.css
│   │   │   │   ├── ComplaintCard.js      (Individual complaint)
│   │   │   │   ├── ComplaintCard.css
│   │   │   │   ├── ComplaintsModal.js    (Modal dialog)
│   │   │   │   ├── ComplaintsModal.css
│   │   │   │   │
│   │   │   ├── Admin Components
│   │   │   │   ├── AdminLogin.js
│   │   │   │   ├── AdminLogin.css
│   │   │   │   ├── AdminDashboard.js
│   │   │   │   ├── AdminDashboard.css
│   │   │   │   │
│   │   │   └── Auth Pages
│   │   │       └── AuthPages.css
│   │   │
│   │   └── data/                         (Static data)
│   │       └── foodData.js               (Food options & helpers)
│   │
│   └── build/                            (Production build)
│       └── ... (compiled assets)
│
├── backend/                              (Spring Boot Java Backend)
│   ├── pom.xml                           ⭐ Maven configuration
│   ├── src/main/
│   │   ├── java/com/hostel/mess/
│   │   │   ├── MessBreakfastApplication.java  (Main entry point)
│   │   │   │
│   │   │   ├── controller/               (REST Controllers)
│   │   │   │   ├── AuthController.java               POST /api/auth/**
│   │   │   │   ├── MealController.java               GET/POST /api/meals/**
│   │   │   │   ├── GroupController.java              POST /api/groups/**
│   │   │   │   ├── GroupMealStatusController.java    POST /api/groups/meals/**
│   │   │   │   ├── ChatController.java               POST/GET /api/chat/**
│   │   │   │   ├── ComplaintController.java          POST/GET /api/complaints/**
│   │   │   │   ├── BreakfastController.java          GET/POST /api/breakfast/**
│   │   │   │   └── AdminController.java              (Admin endpoints)
│   │   │   │
│   │   │   ├── service/                  (Business Logic)
│   │   │   │   ├── AuthService.java      ⭐ User registration & login
│   │   │   │   ├── MealService.java      ⭐ Meal management & verification
│   │   │   │   ├── GroupService.java     ⭐ Group CRUD operations
│   │   │   │   ├── GroupMealStatusService.java       Group meal tracking
│   │   │   │   ├── ChatService.java      ⭐ Message validation & storage
│   │   │   │   ├── ComplaintService.java ⭐ Complaint voting logic
│   │   │   │   ├── BreakfastService.java (Breakfast specific)
│   │   │   │   ├── AdminService.java     (Admin functions)
│   │   │   │   └── GroupService.java     (Group logic)
│   │   │   │
│   │   │   ├── repository/               (Data Access Layer)
│   │   │   │   ├── UserRepository.java
│   │   │   │   ├── MealRepository.java
│   │   │   │   ├── GroupRepository.java
│   │   │   │   ├── GroupMealStatusRepository.java
│   │   │   │   ├── ChatMessageRepository.java
│   │   │   │   ├── ComplaintRepository.java
│   │   │   │   ├── BreakfastRepository.java
│   │   │   │   └── AdminRepository.java
│   │   │   │
│   │   │   ├── model/                    (MongoDB Documents)
│   │   │   │   ├── User.java             ⭐ User entity
│   │   │   │   ├── MealUpdate.java       ⭐ Meal document
│   │   │   │   ├── Group.java            ⭐ Group entity
│   │   │   │   ├── GroupMealStatus.java  ⭐ Meal status tracking
│   │   │   │   ├── ChatMessage.java      ⭐ Chat messages (TTL index)
│   │   │   │   ├── Complaint.java        ⭐ Complaint document
│   │   │   │   ├── BreakfastUpdate.java  (Legacy breakfast)
│   │   │   │   ├── Admin.java            (Admin user)
│   │   │   │   └── ... (other entities)
│   │   │   │
│   │   │   ├── dto/                      (Data Transfer Objects)
│   │   │   │   ├── LoginRequest.java
│   │   │   │   ├── LoginResponse.java    ⭐ Auth response with token
│   │   │   │   ├── MealRequest.java      ⭐ Meal update request
│   │   │   │   ├── MealResponse.java     ⭐ Meal response
│   │   │   │   ├── GroupResponse.java
│   │   │   │   ├── ChatRequest.java
│   │   │   │   ├── ChatResponse.java
│   │   │   │   ├── ComplaintRequest.java
│   │   │   │   ├── ComplaintResponse.java
│   │   │   │   ├── ApiResponse.java      ⭐ Generic response wrapper
│   │   │   │   └── ... (others)
│   │   │   │
│   │   │   ├── config/                   (Configuration)
│   │   │   │   ├── SecurityConfig.java   ⭐ Spring Security with JWT
│   │   │   │   └── CorsConfig.java       ⭐ CORS for frontend
│   │   │   │
│   │   │   └── security/                 (JWT & Auth)
│   │   │       ├── JwtTokenProvider.java ⭐ Token creation/validation
│   │   │       └── JwtAuthenticationFilter.java ⭐ Request filter
│   │   │
│   │   └── resources/
│   │       └── application.properties    (Configuration)
│   │
│   └── target/                           (Build output)
│       └── mess-breakfast-1.0.0.jar     ⭐ Executable JAR
│
├── .github/
│   └── copilot-instructions.md          (AI assistant instructions)
│
└── Dockerfile                            (Docker configuration)
```

---

## 📊 File Count Summary

| Category | Count | Type |
|----------|-------|------|
| **Frontend Components** | 25 | .js/.css |
| **Backend Controllers** | 8 | .java |
| **Backend Services** | 9 | .java |
| **Backend Models** | 10 | .java |
| **Backend DTOs** | 15 | .java |
| **Repositories** | 9 | .java |
| **Documentation** | 3 | .md |
| **Configuration** | 4 | .json/.xml/.properties |
| **Total Source Files** | ~100+ | |

---

## 🎯 Core Components by Feature

### 1. 🔐 **Authentication System**
- **Frontend**: `authService.js`, `Login.js`, `Register.js`, `ProtectedRoute.js`
- **Backend**: `AuthService.java`, `AuthController.java`, `LoginRequest.java`, `LoginResponse.java`
- **Security**: `JwtTokenProvider.java`, `JwtAuthenticationFilter.java`
- **Configuration**: `SecurityConfig.java`

**Key Points**:
- ✅ JWT token-based authentication
- ✅ 24-hour token expiration
- ✅ Secure password hashing (BCrypt)
- ✅ Token stored in localStorage

---

### 2. 🍽️ **Meal Management**
- **Frontend**: `MealTabs.js`, `FoodGrid.js`, `FoodCard.js`, `TodayMenuDisplay.js`
- **Backend**: `MealService.java`, `MealController.java`, `MealRepository.java`
- **Models**: `MealUpdate.java`
- **DTOs**: `MealRequest.java`, `MealResponse.java`
- **Data**: `foodData.js`

**Key Points**:
- ✅ Real-time meal updates (BREAKFAST, LUNCH, SNACKS, DINNER)
- ✅ Verification status tracking (UNVERIFIED/VERIFIED/UNCERTAIN)
- ✅ Time-based update windows
- ✅ Multi-user confirmation system

---

### 3. 👥 **Group Management**
- **Frontend**: `GroupDashboard.js`, `CreateGroup.js`, `JoinGroup.js`, `GroupCodeShare.js`, `GroupStatusList.js`
- **Backend**: `GroupService.java`, `GroupController.java`, `GroupRepository.java`
- **Models**: `Group.java`, `GroupMealStatus.java`
- **Services**: `GroupMealStatusService.java`, `GroupMealStatusController.java`

**Key Points**:
- ✅ 8-character alphanumeric group codes
- ✅ Group creation & joining
- ✅ Member management
- ✅ Meal "going" status tracking (30-min auto-expiry)

---

### 4. 💬 **Chat System**
- **Frontend**: `ChatWindow.js`, `MessageBubble.js`, `MessageInput.js`, `UniversalChatPage.js`, `GroupChatPage.js`
- **Backend**: `ChatService.java`, `ChatController.java`, `ChatMessageRepository.java`
- **Models**: `ChatMessage.java`
- **DTOs**: `ChatRequest.java`, `ChatResponse.java`

**Key Points**:
- ✅ Group chat (private, members only)
- ✅ Community chat (public, all users)
- ✅ Anonymous messaging (username only)
- ✅ 24-hour auto-expiration (community only)
- ✅ Character limits (150 universal, 500 group)
- ✅ Admin message deletion

---

### 5. 🗣️ **Mess Voice (Complaints)**
- **Frontend**: `MessVoice.js`, `ComplaintCard.js`, `ComplaintsModal.js`
- **Backend**: `ComplaintService.java`, `ComplaintController.java`, `ComplaintRepository.java`
- **Models**: `Complaint.java`
- **DTOs**: `ComplaintRequest.java`, `ComplaintResponse.java`
- **API**: `complaints.js`

**Key Points**:
- ✅ Complaint creation (6 complaint types)
- ✅ Democratic voting (AGREE/DISAGREE)
- ✅ Automatic status updates
- ✅ Threshold-based resolution (3+ agreements = VERIFIED)
- ✅ Status tracking (OPEN/RESOLVED/REJECTED)

---

### 6. ⚙️ **API & Service Layer**
- **Frontend Services**:
  - `api.js` - Main API with JWT interceptor
  - `authService.js` - Token management
  - `complaints.js` - Complaints API with JWT interceptor
  - `groupApi.js` - Group operations

- **Backend Controllers** (REST endpoints):
  - `AuthController` → `/api/auth/**`
  - `MealController` → `/api/meals/**`
  - `GroupController` → `/api/groups/**`
  - `ChatController` → `/api/chat/**`
  - `ComplaintController` → `/api/complaints/**`

---

## 🔧 Technology Stack

### Frontend
```
React 18+
├── React Router v6 (routing)
├── Axios (HTTP client)
├── CSS3 (styling)
└── localStorage (state persistence)
```

### Backend
```
Spring Boot 3.2.1
├── Spring Security (JWT auth)
├── Spring Data MongoDB (persistence)
├── Jakarta Bean Validation
├── Apache Tomcat 10.1.17
└── JJWT 0.12.3 (JWT)
```

### Database
```
MongoDB 4.11.1
├── Collections: users, mealUpdate, groups, chatMessages, complaints, etc.
├── TTL Indexes (auto-expiration)
└── Compound Indexes (performance)
```

---

## 📡 API Endpoint Map

### Authentication
```
POST   /api/auth/register        → AuthController.register()
POST   /api/auth/login           → AuthController.login()
```

### Meals
```
GET    /api/meals/today/{type}   → MealController.getTodayMeal()
POST   /api/meals/update         → MealController.updateMeal()
DELETE /api/meals/admin/{type}   → MealController.deleteTodayMenuAdmin()
```

### Groups
```
POST   /api/groups/create        → GroupController.createGroup()
POST   /api/groups/join          → GroupController.joinGroup()
GET    /api/groups/my-groups     → GroupController.getUserGroups()
GET    /api/groups/{id}          → GroupController.getGroupDetails()
POST   /api/groups/{id}/meals/going → GroupMealStatusController.markGoingForMeal()
```

### Chat
```
POST   /api/chat/send            → ChatController.sendMessage()
GET    /api/chat/messages        → ChatController.getMessages()
DELETE /api/chat/{id}            → ChatController.deleteMessage()
```

### Complaints
```
POST   /api/complaints/create    → ComplaintController.createComplaint()
GET    /api/complaints/today     → ComplaintController.getTodayComplaints()
POST   /api/complaints/{id}/vote → ComplaintController.voteOnComplaint()
```

---

## 📦 Build & Deploy

### Build Backend
```bash
cd backend
mvn clean package -DskipTests
# Creates: target/mess-breakfast-1.0.0.jar
```

### Build Frontend
```bash
cd frontend
npm run build
# Creates: build/ directory
```

### Run Services
```bash
# Terminal 1: MongoDB
mongod

# Terminal 2: Backend
java -jar backend/target/mess-breakfast-1.0.0.jar

# Terminal 3: Frontend
cd frontend && npm start
```

---

## 🔒 Security Features

✅ **JWT Authentication**
- Token-based stateless auth
- 24-hour expiration
- Automatic refresh on login

✅ **CORS Configuration**
- localhost:3000 allowed
- Authorization header exposed
- Credentials enabled

✅ **Public Endpoints**
- `/api/auth/**` (registration, login)
- `/api/chat/**` (group/community chat)
- `/api/groups/**` (group operations)
- `/api/complaints/**` (complaint voting)

✅ **Protected Endpoints**
- POST `/api/meals/update`
- POST `/api/complaints/create`
- Admin-only delete endpoints

---

## 📚 Documentation Files

| File | Purpose | Size |
|------|---------|------|
| `README.md` | Project overview | Main docs |
| `COMPLETE_SYSTEM_GUIDE.md` | Comprehensive guide | 2000+ lines |
| `PROJECT_STRUCTURE.md` | This file | Structure overview |
| `.github/copilot-instructions.md` | AI instructions | Reference |

---

## 🚀 Quick Start

```bash
# Start all services
# Terminal 1
mongod

# Terminal 2
cd backend && java -jar target/mess-breakfast-1.0.0.jar

# Terminal 3
cd frontend && npm start

# Access at http://localhost:3000
```

---

## ✨ Key Features at a Glance

| Feature | Files | Status |
|---------|-------|--------|
| User Authentication | authService.js, AuthController.java | ✅ Complete |
| Meal Management | MealTabs.js, MealService.java | ✅ Complete |
| Group System | GroupDashboard.js, GroupService.java | ✅ Complete |
| Chat (Group & Community) | ChatWindow.js, ChatService.java | ✅ Complete |
| Complaints/Voting | MessVoice.js, ComplaintService.java | ✅ Complete |
| JWT Security | api.js, JwtTokenProvider.java | ✅ Complete |
| Database (MongoDB) | Models/*.java, Repositories/*.java | ✅ Complete |

---

**Created**: January 25, 2026  
**Version**: 1.0 Complete  
**Status**: ✅ Production Ready  
**Total Files**: 100+  
**Total Lines**: 4000+
