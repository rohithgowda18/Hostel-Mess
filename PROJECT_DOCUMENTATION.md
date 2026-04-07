# Hostel Mess Management System - Complete Project Documentation

## 📋 Project Overview

The **Hostel Mess Management System** is a comprehensive web application designed to streamline meal coordination, meal planning, and communication within hostel dining facilities. It enables hostel residents to track meal schedules, vote on meal quality, create groups for meal coordination, and communicate in real-time.

**Project Name:** mess-breakfast  
**Version:** 1.0.0  
**Created:** 2026  
**Status:** Active Development

---

## 🎯 Purpose & Key Objectives

1. **Meal Coordination** - Students can mark attendance for meals (Breakfast, Lunch, Evening Snacks, Dinner)
2. **Group Management** - Create and join dining groups for coordinated meal planning
3. **Meal Planning** - Post daily meal menus for all four meal types
4. **Feedback System** - Vote on meal quality and raise complaints about food items
5. **Real-time Communication** - Community chat and group-specific messaging
6. **User Authentication** - Secure JWT-based authentication system
7. **Data Persistence** - MongoDB-based data storage with replica sets for reliability

---

## 🏗️ System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Dashboard │ Groups │ Profile │ Voting │ Feedback   │   │
│  └─────────────────────────────────────────────────────┐    │
│                          ▼                              │    │
│                   API Client + Axios                    │    │
│                  (JWT Interceptor)                      │    │
└─────────────────────────────────────────────────────────┘    │
                          │ HTTPS                              │
                          ▼                                     │
┌─────────────────────────────────────────────────────────────┐
│               Backend (Spring Boot 3.2.1)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Controllers │ Services │ Repositories │ Models       │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  REST API Endpoints (JSON)                           │   │
│  │  - Auth (Login, Register)                            │   │
│  │  - Groups (Create, Join, Get)                        │   │
│  │  - Meals (Post, Update, Delete)                      │   │
│  │  - Feedback (Post, Vote)                             │   │
│  │  - Chat (Send, Retrieve)                             │   │
│  │  - Meal Status (Mark Going, Cancel)                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│  Security Filter Chain                                      │
│  ├─ JWT Authentication Filter                               │
│  ├─ CORS Configuration                                      │
│  └─ Spring Security Configuration                           │
│                          │                                   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│         MongoDB Atlas (Cloud Database - AWS Mumbai)         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Cluster0 (3-Node Replica Set)                       │   │
│  │  - Primary (Write Operations)                        │   │
│  │  - Secondary 1 (Read Replicas)                       │   │
│  │  - Secondary 2 (Read Backups)                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Collections:                                               │
│  ├─ users (Credentials, Profile)                            │
│  ├─ groups (Group Info, Members)                            │
│  ├─ meals (Daily Menu Items)                                │
│  ├─ groupMealStatus (Attendance Tracking)                   │
│  ├─ complaints (Meal Feedback/Complaints)                   │
│  └─ messages (Chat History)                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

### **Frontend**

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18 | UI Library, Component-based architecture |
| **Vite** | 5.x | Build tool, Fast dev server (HMR) |
| **React Router** | v6 | Client-side routing with query parameters |
| **Axios** | Latest | HTTP client with JWT interceptor |
| **Radix UI** | Latest | Accessible UI component primitives |
| **shadcn/ui** | Latest | Pre-styled React components |
| **Lucide Icons** | Latest | Icon library |
| **Tailwind CSS** | Latest | Utility-first CSS framework |
| **PostCSS** | Latest | CSS processing |

**Key Libraries:**
- `@radix-ui/react-dialog` - Modal dialogs
- `@radix-ui/react-tabs` - Tab navigation
- `@radix-ui/react-badge` - Status badges
- `lucide-react` - SVG icons

**Development Server:**
- Localhost: `http://localhost:5173`
- Hot Module Replacement (HMR) enabled

---

### **Backend**

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Spring Boot** | 3.2.1 | Java web framework |
| **Java** | 21 | Programming language |
| **Spring Data MongoDB** | 4.2.1 | MongoDB ORM |
| **Spring Security** | 6.2.1 | Authentication & Authorization |
| **Spring Web (MVC)** | 6.1.2 | REST API development |
| **JWT (JSON Web Token)** | Custom | Stateless authentication |
| **Tomcat** | 10.1.17 | Embedded servlet container |
| **Maven** | 3.9+ | Build tool & dependency management |

**Key Dependencies:**
- `spring-boot-starter-data-mongodb` - MongoDB integration
- `spring-boot-starter-security` - Spring Security
- `spring-boot-starter-web` - REST APIs
- `spring-boot-devtools` - Live reload
- `lombok` - Code generation
- `jackson` - JSON processing

**Server Details:**
- Port: `8080`
- Context Path: `/`
- Build Command: `mvn clean install`
- Run Command: `mvn spring-boot:run`

---

### **Database**

| Technology | Version | Purpose |
|-----------|---------|---------|
| **MongoDB Atlas** | 7.0+ | Cloud NoSQL database |
| **Replica Set** | 3 nodes | High availability & failover |
| **Region** | AWS Mumbai (ap-south-1) | Proximity to users |
| **Storage** | Shared Cluster | Development tier |

**Connection Details:**
- **Connection String:** `mongodb+srv://[username]:[password]@cluster0.bqf9l9q.mongodb.net/hostel_mess`
- **Database Name:** `hostel_mess`
- **Replica Set:** Cluster0-shard-0
- **Read Preference:** secondaryPreferred (reads from secondary if primary unavailable)
- **Write Concern:** majority (writes to primary and at least one secondary)

**Timeout Configuration:**
- `serverSelectionTimeoutMS`: 30000 (30 seconds to find a healthy node)
- `socketTimeoutMS`: 120000 (120 seconds for response)
- `connectTimeoutMS`: 15000 (15 seconds to establish connection)
- `heartbeatFrequencyMS`: 5000 (check node health every 5 seconds)

---

## 📱 Frontend Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── dashboard/           # Dashboard widgets
│   │   │   ├── todays-menu-card.jsx          # Meal menu display
│   │   │   ├── community-chat-preview.jsx    # Live chat
│   │   │   ├── group-voting-section.jsx      # Meal feedback
│   │   │   ├── quick-stats-grid.jsx          # Analytics
│   │   │   ├── recent-feedback-table.jsx     # Complaints
│   │   │   └── empty-state.jsx               # Placeholder
│   │   ├── daily-meal/           # Meal management
│   │   │   ├── FoodSelectionGrid.jsx         # Food item selection
│   │   │   ├── BreakfastPostedSection.jsx    # Current meal display
│   │   │   └── UpdateBreakfastButton.jsx     # Submit meal
│   │   ├── layout/
│   │   │   ├── app-sidebar.jsx              # Navigation sidebar
│   │   │   └── top-navbar.jsx               # Header bar
│   │   └── ui/                   # Reusable UI components
│   │       ├── button.jsx
│   │       ├── card.jsx
│   │       ├── dialog.jsx        # Modal dialogs
│   │       ├── badge.jsx
│   │       ├── tabs.jsx
│   │       ├── input.jsx
│   │       ├── table.jsx
│   │       ├── skeleton.jsx      # Loading placeholders
│   │       ├── dropdown-menu.jsx
│   │       └── avatar.jsx
│   ├── pages/
│   │   ├── dashboard-page.jsx    # Main dashboard
│   │   ├── login-page.jsx        # Authentication
│   │   ├── groups-page.jsx       # Group listing
│   │   └── group-detail-page.jsx # Group management
│   ├── services/
│   │   ├── api-client.js         # Axios instance with JWT
│   │   ├── auth-service.js       # Login/Register
│   │   └── mess-api.js           # API endpoints
│   ├── context/
│   │   └── theme-context.jsx     # Global theme state
│   ├── layouts/
│   │   └── dashboard-layout.jsx  # Main layout wrapper
│   ├── config/
│   │   ├── navigation.js         # Route configuration
│   │   └── food-options.js       # Meal data
│   ├── lib/
│   │   └── utils.js              # Utility functions (cn, etc.)
│   ├── App.jsx                   # Root component
│   ├── main.jsx                  # Entry point
│   └── index.css                 # Global styles
├── public/                        # Static assets
├── package.json                  # Dependencies
├── vite.config.js               # Vite configuration
├── tailwind.config.js           # Tailwind CSS config
├── postcss.config.js            # PostCSS config
└── jsconfig.json                # JavaScript config
```

---

## 💻 Backend Structure

```
backend/
├── src/main/java/com/hostel/mess/
│   ├── MessBreakfastApplication.java           # Spring Boot entry point
│   ├── config/
│   │   ├── SecurityConfig.java                # Spring Security setup
│   │   ├── CorsConfig.java                    # CORS configuration
│   │   ├── WebSocketConfig.java               # WebSocket (if used)
│   │   └── CleanupScheduler.java              # Scheduled tasks
│   ├── controller/
│   │   ├── AuthController.java                # Login/Register endpoints
│   │   ├── BreakfastController.java           # Meal menu endpoints
│   │   ├── GroupController.java               # Group management
│   │   ├── GroupMealStatusController.java     # Attendance marking
│   │   ├── FeedbackController.java            # Complaints/voting
│   │   ├── ChatController.java                # Messaging
│   │   ├── UserController.java                # User profile
│   │   └── HealthCheckController.java         # System status
│   ├── service/
│   │   ├── AuthService.java                   # Auth business logic
│   │   ├── BreakfastService.java              # Meal management
│   │   ├── GroupService.java                  # Group logic
│   │   ├── GroupMealStatusService.java        # Attendance logic
│   │   ├── FeedbackService.java               # Complaint logic
│   │   ├── ChatService.java                   # Message logic
│   │   └── UserService.java                   # User logic
│   ├── repository/
│   │   ├── UserRepository.java                # User queries
│   │   ├── GroupRepository.java               # Group queries
│   │   ├── BreakfastRepository.java           # Meal queries
│   │   ├── GroupMealStatusRepository.java     # Attendance queries
│   │   ├── FeedbackRepository.java            # Complaint queries
│   │   └── ChatRepository.java                # Message queries
│   ├── model/
│   │   ├── User.java                          # User entity
│   │   ├── Group.java                         # Group entity
│   │   ├── Breakfast.java                     # Meal entity
│   │   ├── GroupMealStatus.java               # Attendance entity
│   │   ├── Feedback.java                      # Complaint entity
│   │   └── Message.java                       # Message entity
│   ├── dto/
│   │   ├── LoginRequest.java
│   │   ├── RegisterRequest.java
│   │   ├── GroupResponse.java
│   │   ├── GroupMealStatusResponse.java
│   │   └── (other DTOs)
│   ├── security/
│   │   ├── JwtTokenProvider.java              # JWT generation/parsing
│   │   ├── CustomUserDetailsService.java      # User loading
│   │   ├── JwtAuthenticationFilter.java       # JWT validation filter
│   │   └── JwtAuthenticationEntryPoint.java   # Error responses
│   └── exception/
│       ├── ResourceNotFoundException.java
│       └── (custom exceptions)
├── src/main/resources/
│   ├── application.properties                 # Configuration
│   └── application-dev.properties             # Dev profile
├── pom.xml                                    # Maven dependencies
└── target/                                    # Build artifacts
```

---

## 🔌 How Connection Works

### **Authentication Flow**

```
1. User Login (Frontend)
   ├─ POST /api/auth/login
   ├─ Body: { username, password }
   └─ Response: { token, userId, username, email }

2. Store JWT Token (Frontend)
   ├─ Save to localStorage as 'authToken'
   └─ Set up Axios interceptor to attach to all requests

3. JWT Interceptor (Frontend - axios)
   ├─ On every request, add: Authorization: Bearer <token>
   └─ On 401 response, redirect to login

4. JWT Validation (Backend - Filter)
   ├─ Extract token from Authorization header
   ├─ Validate signature and expiration
   ├─ Load UserDetails from database
   └─ Set SecurityContext for the request
```

### **Database Connection Flow**

```
Frontend Request
    │
    ▼
Axios HTTP Request (Port 8080)
    │
    ▼
Spring Boot REST Controller
    │
    ▼
JWT Authentication Filter
    ├─ Extract token from header
    └─ Load user from MongoDB via UserRepository
    │
    ▼
Service Layer (Business Logic)
    ├─ UserService: Manage users
    ├─ GroupService: Manage groups
    ├─ GroupMealStatusService: Track attendance
    └─ ChatService: Handle messages
    │
    ▼
Spring Data MongoDB Repository
    ├─ Execute query against MongoDB
    └─ Auto-serialize Java objects to BSON
    │
    ▼
MongoDB Atlas Cluster (Cloud)
    ├─ Primary Node: Handles writes
    ├─ Secondary 1: Read replicas
    └─ Secondary 2: Failover backup
    │
    ▼
Response serialized to JSON
    │
    ▼
Frontend receives response
```

### **Real-Time Data Flow Example: Marking a Meal as "Going"**

```
User clicks "Mark Going" Button (Frontend)
    │
    ▼
POST /api/group-meal-status/going
Body: { groupId: "123abc", mealType: "DINNER" }
Header: Authorization: Bearer JWT_TOKEN
    │
    ▼
Backend REST Endpoint
├─ Extract JWT token
├─ Get authenticated user from SecurityContext
├─ Retrieve user email from UserRepository
    │
    ▼
GroupMealStatusService.markUserGoing()
├─ Check if user is member of group (using both email and ID for backward compatibility)
├─ Create or update GroupMealStatus document
├─ Add user email to goingUsers array
├─ Save to MongoDB
    │
    ▼
MongoDB Replica Set
├─ Write to Primary
├─ Replicate to Secondary 1, 2 (for durability)
└─ Return acknowledgment (w: majority)
    │
    ▼
Response sent to Frontend
├─ Status: 200 OK
├─ Body: { groupId, mealType, goingUsers, goingCount }
    │
    ▼
Frontend updates state
├─ Update button text to "Cancel Going"
├─ Update going count badge
└─ Re-render component
```

---

## 🔑 Key Features

### **1. Meal Management**
- Upload daily menus for all 4 meal types
- Add custom food items
- View current meal prominently (time-based detection)
- Support for multiple meal types per day

### **2. Group Management**
- Create groups with unique codes
- Join existing groups
- Email-based member tracking
- Group creator assignment
- Member count tracking

### **3. Attendance Tracking**
- Mark "Going" for meals with time-based restrictions
- Real-time going count display
- Support for both old (ID-based) and new (email-based) groups
- Automatic notification updates

### **4. Feedback & Voting**
- Post complaints about meal items
- Upvote/Downvote feedback
- View complaint statistics
- Filter by meal type

### **5. Communication**
- Community-wide chat
- Group-specific messaging
- See online users
- Real-time message updates
- Message history retrieval

### **6. User Profile**
- Store hostel, room number, year, branch
- View profile information
- Edit user details
- Authentication credentials management

### **7. Dashboard Analytics**
- Quick stats (total meals, groups, members)
- Recent feedback trends
- Group activity overview
- Today's menu preview

---

## 📊 Data Models

### **User Model**
```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  hostel: String,
  roomNumber: String,
  year: String,
  branch: String,
  role: String (USER, ADMIN),
  createdAt: Date,
  updatedAt: Date
}
```

### **Group Model**
```javascript
{
  _id: ObjectId,
  name: String,
  groupCode: String (unique),
  creator: String (email),
  members: [String] (emails or IDs - backward compatible),
  memberCount: Number,
  description: String,
  createdAt: Date,
  updatedAt: Date
}
```

### **GroupMealStatus Model**
```javascript
{
  _id: ObjectId,
  groupId: ObjectId,
  mealType: String (BREAKFAST, LUNCH, SNACKS, DINNER),
  date: Date,
  goingUsers: [String] (emails),
  goingCount: Number,
  expiresAt: Date (TTL index for auto-deletion),
  createdAt: Date,
  updatedAt: Date
}
```

### **Message Model**
```javascript
{
  _id: ObjectId,
  messageType: String (UNIVERSAL, GROUP),
  groupId: ObjectId (null for universal),
  senderId: ObjectId,
  senderName: String,
  message: String,
  createdAt: Date,
  updatedAt: Date
}
```

### **Feedback Model**
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  mealType: String,
  foodItem: String,
  reasons: [String],
  comment: String,
  upvotes: Number,
  downvotes: Number,
  userVotes: [{ userId, voteType }],
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔐 Security Features

### **Authentication**
- JWT (JSON Web Token) based
- 24-hour token expiration
- Token stored in localStorage (frontend)
- Secure password hashing (BCrypt)

### **Authorization**
- Role-based access (USER, ADMIN)
- Authentication required for most endpoints
- User can only access their own data
- Group member verification

### **CORS Configuration**
- Allow requests from `http://localhost:5173` (frontend)
- Allow credentials and specific headers
- Configurable for production

### **MongoDB Security**
- IP whitelist (0.0.0.0/0 for development)
- Connection string with username/password
- SSL/TLS encryption in transit
- Replica set authentication

---

## 🚀 Setup & Deployment

### **Frontend Setup**
```bash
cd frontend
npm install
npm run dev          # Start dev server on :5173
npm run build        # Build for production
npm run preview      # Preview production build
```

### **Backend Setup**
```bash
cd backend
mvn clean install    # Download dependencies & compile
mvn spring-boot:run  # Start server on :8080
mvn test             # Run unit tests
```

### **Environment Variables (Backend)**
```properties
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRATION=86400000  # 24 hours in ms
```

### **MongoDB Atlas Setup**
1. Create cluster on MongoDB Atlas
2. Whitelist IP address (0.0.0.0/0 for dev)
3. Create database user
4. Copy connection string
5. Update `application.properties`

---

## 🔄 API Endpoints

### **Authentication**
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login & get JWT

### **Groups**
- `POST /api/groups/create` - Create new group
- `POST /api/groups/join` - Join existing group
- `GET /api/groups/my-groups` - Get user's groups
- `GET /api/groups/{groupId}` - Get group details
- `POST /api/groups/leave` - Leave group

### **Meals**
- `POST /api/breakfast/post` - Post meal menu
- `GET /api/breakfast/today` - Get today's meals
- `GET /api/breakfast/{mealType}` - Get specific meal

### **Meal Status (Attendance)**
- `POST /api/group-meal-status/going` - Mark going for meal
- `DELETE /api/group-meal-status/{groupId}/{mealType}` - Cancel going
- `GET /api/group-meal-status/{groupId}/{mealType}` - Get attendance

### **Feedback**
- `POST /api/feedback/complaint` - Raise complaint
- `POST /api/feedback/vote` - Vote on complaint
- `GET /api/feedback` - Get all complaints

### **Chat**
- `POST /api/chat/send` - Send message
- `GET /api/chat/messages` - Retrieve messages

### **User**
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile

---

## 📈 Performance Considerations

### **Frontend Optimization**
- Code splitting with React lazy loading
- Image lazy loading from Unsplash API
- Component memoization with useMemo
- Efficient state management

### **Backend Optimization**
- Database indexing on frequently queried fields
- Connection pooling
- Caching with TTL indexes
- Async processing where applicable

### **Database Optimization**
- Replica set for read scalability
- Sharding ready (cluster configuration)
- TTL indexes for automatic cleanup
- Proper field indexing

---

## 🐛 Troubleshooting

### **MongoDB Connection Timeout**
**Symptom:** `MongoTimeoutException` errors  
**Solution:**
1. Check MongoDB Atlas cluster status
2. Verify IP whitelist includes your IP
3. Increase timeout values in `application.properties`
4. Check network connectivity

### **JWT Authentication Fails**
**Symptom:** 401 Unauthorized on requests  
**Solution:**
1. Check token in localStorage
2. Verify token hasn't expired
3. Confirm Authorization header format: `Bearer <token>`
4. Check JWT_SECRET matches between login and validation

### **CORS Errors**
**Symptom:** Cross-origin request blocked  
**Solution:**
1. Verify frontend URL is in CORS whitelist
2. Check `CorsConfig.java` configuration
3. Restart backend server

### **Frontend Build Fails**
**Symptom:** Vite compilation errors  
**Solution:**
1. Clear `node_modules` and reinstall
2. Clear `.vite` cache
3. Check Node.js version (>=16)
4. Verify all imports are correct

---

## 📝 Development Workflow

1. **Start MongoDB Atlas** (already hosted)
2. **Start Backend**: `mvn spring-boot:run` (port 8080)
3. **Start Frontend**: `npm run dev` (port 5173)
4. **Frontend auto-reloads** with HMR when you save files
5. **Backend requires restart** for Java changes
6. **Debug in browser** DevTools for frontend issues
7. **Check backend logs** in terminal for server errors

---

## 🎓 Learning Resources

- **React Docs:** https://react.dev
- **Spring Boot Guides:** https://spring.io/guides
- **MongoDB:** https://docs.mongodb.com
- **JWT:** https://jwt.io
- **Tailwind CSS:** https://tailwindcss.com
- **Radix UI:** https://www.radix-ui.com

---

## 📄 License

This project is developed for hostel mess management and is part of the academic coursework.

---

## 👥 Contributors

- **Rohit** - Full Stack Developer
- **Project Mentor** - Technical Guidance

---

**Last Updated:** April 7, 2026  
**Latest Commit:** Frontend & Backend Integration with MongoDB Atlas
