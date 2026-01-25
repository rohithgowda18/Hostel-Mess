# 🎯 Hostel Mess System - Complete System Guide

**Last Updated**: January 25, 2026  
**Status**: ✅ Production Ready  
**Deployment**: Fully Functional on localhost:3000 (Frontend) & localhost:8080 (Backend)

---

## 📑 Table of Contents

1. [Quick Start](#quick-start)
2. [System Overview](#system-overview)
3. [Features](#features)
4. [Architecture](#architecture)
5. [Getting Started](#getting-started)
6. [API Documentation](#api-documentation)
7. [Frontend Components](#frontend-components)
8. [Database Schema](#database-schema)
9. [Authentication & Security](#authentication--security)
10. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites
- Node.js 16+
- Java 21+
- MongoDB 4.0+

### Start in 3 Commands

```bash
# Terminal 1: Start MongoDB
mongod

# Terminal 2: Start Backend
cd backend
java -jar target/mess-breakfast-1.0.0.jar

# Terminal 3: Start Frontend
cd frontend
npm start
```

**Access**: http://localhost:3000

---

## System Overview

The Hostel Mess Live Menu is a comprehensive system for managing hostel dining with:

### Core Features

#### 1. 🍽️ **Live Menu Management**
- Real-time meal updates (BREAKFAST, LUNCH, SNACKS, DINNER)
- Today's menu display with verification status
- Time-based update windows
- User-based meal selection

#### 2. 👥 **Buddy Groups**
- Create/join groups with 8-character alphanumeric codes
- Group-based meal coordination
- "Going" status tracking (30-min auto-expiry)
- Member management with real-time updates

#### 3. 💬 **Messaging System**
- **Group Chat**: Private communication within buddy groups
- **Community Chat**: Public hostel-wide discussions
- Anonymous messaging (username only)
- 24-hour message expiration (community chat)
- Admin message moderation
- Message character limits (150 universal, 500 group)

#### 4. 🗣️ **Mess Voice (Complaints)**
- Democratic food quality feedback system
- Complaint categories (Poor Taste, Quality, Portion, Temperature, Hygiene, Service)
- AGREE/DISAGREE voting mechanism
- Automatic resolution thresholds
- Status tracking (Open, Resolved, Rejected)

#### 5. 🔐 **Authentication**
- User registration and login
- JWT token-based security
- 24-hour token expiration
- Secure password storage
- Role-based access control

---

## Features

### 🍽️ Meal Management

**What Users Can Do:**
- View today's meal for each meal type
- Select food items for each meal
- Submit their selected items
- See verification status (Unverified/Verified/Uncertain)
- View confirmation counts

**Time Windows:**
- BREAKFAST: 07:00 - 09:30
- LUNCH: 12:00 - 14:30
- SNACKS: 16:30 - 18:00
- DINNER: 19:30 - 21:30

**Note**: Time restrictions are disabled for development (`DISABLE_TIME_RESTRICTIONS = true`)

### 👥 Group Management

**Group Features:**
- Create groups with custom names
- Auto-generated 8-character group codes (e.g., `KJ9L2X4M`)
- Join using group code
- View group members
- Track meal "going" status
- Real-time updates

**Join Code Format:**
- 8 characters (uppercase letters A-Z, digits 0-9)
- Format: `ABCD1234`
- ~2.8 trillion combinations

### 💬 Chat Features

**Group Chat:**
- Private conversations within buddy groups
- Member-only access
- 500-character limit per message
- No expiration
- Admin can delete any message

**Community Chat:**
- Public hostel-wide discussions
- Anonymous participation
- 150-character limit per message
- 24-hour automatic expiration
- Admin moderation available

### 🗣️ Mess Voice System

**Complaint Process:**
1. Select a food item that has an issue
2. Choose complaint type (6 categories)
3. Add optional comments
4. Submit complaint

**Voting System:**
- Other students can AGREE or DISAGREE
- Each user votes once per complaint
- Threshold: 3 agreements = VERIFIED
- Status updates automatically

**Outcomes:**
- UNVERIFIED: Awaiting community feedback
- VERIFIED: 3+ agreements (management notified)
- UNCERTAIN: Mixed feedback received

---

## Architecture

### Technology Stack

#### Backend
- **Framework**: Spring Boot 3.2.1
- **Language**: Java 21
- **Web Server**: Apache Tomcat 10.1.17
- **Database**: MongoDB 4.11.1
- **Authentication**: JWT (JJWT 0.12.3)
- **Validation**: Jakarta Bean Validation
- **Build**: Maven 3+

#### Frontend
- **Library**: React 18+
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Styling**: CSS3
- **Node**: 16+ with npm

### Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│           React Frontend (Port 3000)             │
│  ┌──────────────────────────────────────────┐  │
│  │  App Router                               │  │
│  │  ├─ Dashboard (Protected)                │  │
│  │  ├─ Community Chat (Public)              │  │
│  │  ├─ Group Chat (Public)                  │  │
│  │  ├─ Login/Register                       │  │
│  │  └─ Admin Login (if needed)              │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  Services:                                       │
│  ├─ api.js (Axios + JWT interceptor)           │
│  ├─ authService.js (Token management)          │
│  └─ complaints.js (Axios with interceptor)     │
└─────────────────────────────────────────────────┘
          ↕ HTTP/CORS (Authorization Header)
┌─────────────────────────────────────────────────┐
│       Spring Boot Backend (Port 8080)            │
│  ┌──────────────────────────────────────────┐  │
│  │  Security Layer                          │  │
│  │  ├─ JwtAuthenticationFilter              │  │
│  │  ├─ SecurityConfig (permitAll routes)    │  │
│  │  └─ CorsFilter (localhost:3000)          │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  Controllers:                                    │
│  ├─ AuthController (/api/auth/**)              │
│  ├─ MealController (/api/meals/**)             │
│  ├─ GroupController (/api/groups/**)           │
│  ├─ ChatController (/api/chat/**)              │
│  └─ ComplaintController (/api/complaints/**)   │
│                                                  │
│  Services:                                       │
│  ├─ AuthService                               │
│  ├─ MealService                               │
│  ├─ GroupService                              │
│  ├─ ChatService                               │
│  └─ ComplaintService                          │
│                                                  │
│  Repositories:                                   │
│  ├─ UserRepository                            │
│  ├─ MealRepository                            │
│  ├─ GroupRepository                           │
│  ├─ ChatMessageRepository                     │
│  └─ ComplaintRepository                       │
└─────────────────────────────────────────────────┘
          ↕ JDBC/MongoDB Driver
┌─────────────────────────────────────────────────┐
│      MongoDB (Port 27017)                        │
│  Collections:                                    │
│  ├─ users                                       │
│  ├─ mealUpdate                                  │
│  ├─ groups                                      │
│  ├─ chatMessages (TTL index: 24h)              │
│  └─ complaints                                  │
└─────────────────────────────────────────────────┘
```

---

## Getting Started

### Installation

1. **Clone/Extract Project**
```bash
cd Mess
```

2. **Backend Setup**
```bash
cd backend
mvn clean install
```

3. **Frontend Setup**
```bash
cd frontend
npm install
```

4. **Start Services**
```bash
# Terminal 1: MongoDB
mongod

# Terminal 2: Backend
cd backend
java -jar target/mess-breakfast-1.0.0.jar

# Terminal 3: Frontend
cd frontend
npm start
```

5. **Access Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080/api

### User Registration

1. Visit http://localhost:3000/register
2. Fill form:
   - Name: Your name
   - Email: test@example.com
   - Password: min 6 characters
   - Hostel: Your hostel name
3. Register button → Automatic login
4. You're now authenticated!

---

## API Documentation

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "hostel": "Boys Hostel A"
}

Response: 201 Created
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "hostel": "Boys Hostel A"
    }
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "hostel": "Boys Hostel A"
    }
  }
}
```

### Meal Endpoints

#### Get Today's Meal
```http
GET /api/meals/today/{mealType}
Authorization: Bearer {token}

Response: 200 OK
{
  "mealType": "BREAKFAST",
  "date": "2026-01-25",
  "items": ["Idli", "Vada", "Sambar"],
  "postedAt": "2026-01-25T07:30:00Z",
  "confirmations": 5,
  "verificationStatus": "VERIFIED",
  "updateWindowOpen": true,
  "updateWindowMessage": "Update window open until 09:30"
}
```

#### Update/Post Today's Meal
```http
POST /api/meals/update
Authorization: Bearer {token}
Content-Type: application/json

{
  "mealType": "BREAKFAST",
  "date": "2026-01-25",
  "items": ["Idli", "Vada"]
}

Response: 200 OK
{
  "mealType": "BREAKFAST",
  "date": "2026-01-25",
  "items": ["Idli", "Vada"],
  "postedAt": "2026-01-25T08:15:00Z",
  "confirmations": 1,
  "verificationStatus": "UNVERIFIED"
}
```

### Group Endpoints

#### Create Group
```http
POST /api/groups/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Night Owls"
}

Response: 201 Created
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Night Owls",
  "groupCode": "KJ9L2X4M",
  "members": ["user_123"],
  "memberCount": 1,
  "createdAt": "2026-01-25T12:00:00Z"
}
```

#### Join Group
```http
POST /api/groups/join
Authorization: Bearer {token}
Content-Type: application/json

{
  "groupCode": "KJ9L2X4M"
}

Response: 200 OK
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Night Owls",
  "groupCode": "KJ9L2X4M",
  "members": ["user_123", "user_456"],
  "memberCount": 2
}
```

#### Get My Groups
```http
GET /api/groups/my-groups
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "id": "507f1f77bcf86cd799439011",
    "name": "Night Owls",
    "groupCode": "KJ9L2X4M",
    "memberCount": 2
  }
]
```

### Chat Endpoints

#### Send Message
```http
POST /api/chat/send
Authorization: Bearer {token}
Content-Type: application/json

{
  "chatType": "GROUP",
  "chatId": "group_507f1f77bcf86cd799439011",
  "message": "Hey everyone! Let's meet at 12 for lunch?"
}

Response: 201 Created
{
  "id": "507f1f77bcf86cd799439012",
  "username": "John Doe",
  "message": "Hey everyone! Let's meet at 12 for lunch?",
  "timestamp": "2026-01-25T11:45:00Z",
  "chatType": "GROUP"
}
```

#### Get Messages
```http
GET /api/chat/messages?chatType=GROUP&chatId=group_507f1f77bcf86cd799439011
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "id": "507f1f77bcf86cd799439012",
    "username": "John Doe",
    "message": "Hey everyone!",
    "timestamp": "2026-01-25T11:45:00Z"
  }
]
```

### Complaint Endpoints

#### Create Complaint
```http
POST /api/complaints/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "foodItem": "Sambar",
  "mealType": "BREAKFAST",
  "complaintType": "Poor Taste",
  "comments": "Too salty"
}

Response: 201 Created
{
  "id": "507f1f77bcf86cd799439013",
  "foodItem": "Sambar",
  "mealType": "BREAKFAST",
  "complaintType": "Poor Taste",
  "status": "OPEN",
  "agreementCount": 1,
  "disagreementCount": 0
}
```

#### Get Today's Complaints
```http
GET /api/complaints/today?mealType=BREAKFAST
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "id": "507f1f77bcf86cd799439013",
    "foodItem": "Sambar",
    "mealType": "BREAKFAST",
    "complaintType": "Poor Taste",
    "status": "OPEN",
    "agreementCount": 5,
    "disagreementCount": 2
  }
]
```

#### Vote on Complaint
```http
POST /api/complaints/{complaintId}/vote
Authorization: Bearer {token}
Content-Type: application/json

{
  "vote": "AGREE"
}

Response: 200 OK
{
  "id": "507f1f77bcf86cd799439013",
  "status": "VERIFIED",
  "agreementCount": 6,
  "disagreementCount": 2,
  "message": "Complaint verified - 3 agreements reached!"
}
```

---

## Frontend Components

### Core Components

#### App.js
- Main routing component
- Authentication check
- Route protection (ProtectedRoute wrapper)
- Navigation between pages

**Key Routes:**
- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Main app (protected)
- `/community` - Community chat (public)
- `/groups/:groupId/chat` - Group chat (public)

#### Dashboard.js
- Main authenticated page
- Navigation tabs (Menu, Groups, Complaints, Mess Voice)
- User info display
- Logout button

#### MealTabs.js
- Meal type navigation (BREAKFAST, LUNCH, SNACKS, DINNER)
- Active meal highlighting
- Emoji indicators

#### FoodGrid.js
- Grid of available food items
- Food item selection/deselection
- Visual feedback for selected items

#### TodayMenuDisplay.js
- Shows current meal for selected type
- Displays verification status
- Shows confirmation count
- Time window information

#### GroupDashboard.js
- List of user's groups
- "Going" status tracking
- Meal-based filtering
- Create/Join group buttons

#### GroupChatPage.js
- Group chat interface
- Message history
- Message input

#### UniversalChatPage.js
- Community-wide chat
- Anonymous messaging
- Public discussions

#### MessVoice.js
- Complaint system interface
- Complaint list
- Vote interface (AGREE/DISAGREE)
- Status display

---

## Database Schema

### Collections Overview

#### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed),
  hostel: String,
  createdAt: ISODate
}
```

#### MealUpdate Collection
```javascript
{
  _id: ObjectId,
  mealType: String ("BREAKFAST|LUNCH|SNACKS|DINNER"),
  date: String ("YYYY-MM-DD"),
  items: [String],
  postedAt: ISODate,
  confirmations: Number,
  verificationStatus: String ("UNVERIFIED|VERIFIED|UNCERTAIN"),
  createdAt: ISODate
}

// Indexes:
// { mealType: 1, date: 1 } - Compound index
```

#### Groups Collection
```javascript
{
  _id: ObjectId,
  name: String,
  groupCode: String (8 chars),
  members: [String (userId)],
  createdAt: ISODate
}

// Index: { groupCode: 1 } - Unique
```

#### ChatMessages Collection
```javascript
{
  _id: ObjectId,
  username: String,
  message: String,
  chatType: String ("GROUP|UNIVERSAL"),
  chatId: String (groupId or "GLOBAL"),
  userId: String,
  timestamp: ISODate,
  createdAt: ISODate
}

// TTL Index: { createdAt: 1 }, expireAfterSeconds: 86400 (24h for UNIVERSAL only)
```

#### Complaints Collection
```javascript
{
  _id: ObjectId,
  foodItem: String,
  mealType: String,
  complaintType: String,
  userId: String,
  status: String ("OPEN|RESOLVED|REJECTED"),
  agreementCount: Number,
  disagreementCount: Number,
  comments: String,
  createdAt: ISODate,
  votes: {
    [userId]: String ("AGREE|DISAGREE")
  }
}
```

---

## Authentication & Security

### JWT Token Management

**Token Structure:**
```
Header: {
  "alg": "HS256",
  "typ": "JWT"
}

Payload: {
  "sub": "user_id",
  "iat": 1674604800,
  "exp": 1674691200
}

Signature: HMAC-SHA256(secret)
```

**Token Storage:**
- Stored in browser localStorage
- Key: `messApp_token`
- User info key: `messApp_user`

**Token Expiration:**
- 24 hours (86,400,000 ms)
- Automatic refresh on login
- Cleared on logout or 401 response

### Security Features

✅ **CORS Configuration**
- Allowed origins: `localhost:3000`
- Allowed methods: GET, POST, PUT, DELETE, OPTIONS
- Allowed headers: Authorization, Content-Type
- Credentials: Enabled

✅ **JWT Authentication Filter**
- Extracts Bearer token from Authorization header
- Validates token signature
- Sets authenticated principal
- Returns 401 for invalid/missing tokens

✅ **Public Endpoints** (No Authentication Required)
- `/api/auth/**` (register, login)
- `/api/chat/**` (group/community chat)
- `/api/groups/**` (group operations)
- `/api/complaints/**` (complaint voting)
- `GET /api/meals/**` (read meal data)

✅ **Protected Endpoints** (Authentication Required)
- `POST /api/meals/update` (update today's meal)
- `POST /api/complaints/create` (create complaint)
- `DELETE /api/chat/{messageId}` (admin delete)

✅ **Password Security**
- Minimum 6 characters required
- Hashed using BCrypt
- Stored securely in MongoDB

---

## Troubleshooting

### Backend Issues

#### Backend not starting
**Problem**: `java -jar` exits immediately

**Solution**:
```bash
# Check MongoDB is running
mongod

# Check port 8080 is free
netstat -an | grep 8080

# Try with verbose output
java -jar target/mess-breakfast-1.0.0.jar --debug
```

#### MongoDB connection error
**Problem**: `Unable to connect to MongoDB`

**Solution**:
```bash
# Ensure MongoDB is running
mongod

# Check connection string in application.properties
# Should be: spring.data.mongodb.uri=mongodb://localhost:27017/hostel_mess

# Verify MongoDB is on localhost:27017
telnet localhost 27017
```

#### Port 8080 already in use
**Problem**: `Address already in use`

**Solution**:
```bash
# Kill process on 8080
lsof -i :8080
kill -9 <PID>

# Or use different port
java -jar -Dserver.port=9090 target/mess-breakfast-1.0.0.jar
```

### Frontend Issues

#### Frontend not connecting to backend
**Problem**: `Error: Network Error / Unable to reach API`

**Solution**:
1. Ensure backend is running: http://localhost:8080/api/meals/today/BREAKFAST
2. Check CORS configuration in CorsConfig.java
3. Verify API_BASE_URL in api.js: `http://localhost:8080/api`
4. Check browser console for exact error

#### npm start fails
**Problem**: `npm ERR!` or compilation error

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear cache
npm cache clean --force

# Try again
npm start
```

#### Port 3000 already in use
**Problem**: `Port 3000 is already in use`

**Solution**:
```bash
# Kill process on 3000
lsof -i :3000
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

### Authentication Issues

#### "Unauthorized" errors
**Problem**: API returns 401 on protected routes

**Solution**:
1. Check localStorage: `localStorage.getItem('messApp_token')`
2. Verify token in request headers: Authorization: `Bearer {token}`
3. Check token hasn't expired (24h limit)
4. Logout and login again to refresh token

#### Login not working
**Problem**: Can't register or login

**Solution**:
1. Verify MongoDB is running and connected
2. Check email is not already registered
3. Verify password is at least 6 characters
4. Check network tab in DevTools for exact error

### Chat Issues

#### Messages not showing
**Problem**: Chat is empty even after sending messages

**Solution**:
1. Ensure authentication (check token)
2. Check chatId and chatType match on frontend and backend
3. For community chat: messages expire after 24h
4. Verify user is in group (for group chat)

#### 24-hour expiration
**Problem**: Expecting old messages but they're gone

**Solution**:
- This is intentional! Community chat messages auto-delete after 24h
- Group chat messages never expire
- TTL index automatically removes expired documents

---

## Development Tips

### Adding a New Feature

1. **Backend**:
   - Create model class in `model/`
   - Create repository interface extending MongoRepository
   - Create service class with business logic
   - Create controller with REST endpoints
   - Create DTO classes for request/response

2. **Frontend**:
   - Create component in `components/`
   - Create CSS file in same directory
   - Add method in `api.js` for API calls
   - Import and use component in `App.js` or parent

3. **Database**:
   - Add collection reference in model's @Document annotation
   - Create necessary indexes in MongoRepository
   - Update authentication if new protected endpoint

### Debugging

**Backend Logs**:
```bash
# Check application logs
tail -f backend/logs/spring.log

# Enable debug logging
# Set in application.properties:
logging.level.com.hostel.mess=DEBUG
logging.level.org.springframework.security=DEBUG
```

**Frontend Debugging**:
```javascript
// Add debug logs
console.debug('API request:', {token, url, method});

// Check network requests
// Browser DevTools → Network tab → API calls

// Check localStorage
console.log(localStorage.getItem('messApp_token'));
```

**Database Inspection**:
```bash
# Connect to MongoDB
mongosh

# Show collections
show collections

# Query meals
db.mealUpdate.find()

# Query complaints
db.complaints.find()
```

---

## Next Steps

### To Deploy to Production

1. **Backend**:
   - Build JAR: `mvn clean package -DskipTests`
   - Update `application.properties` with production MongoDB URI
   - Set production JWT secret (longer, random string)
   - Deploy JAR to server (e.g., AWS EC2, Heroku)

2. **Frontend**:
   - Build: `npm run build`
   - Update API base URL for production backend
   - Deploy to static hosting (GitHub Pages, Netlify, Vercel)
   - Update CORS allowed origins in backend

3. **Database**:
   - Set up MongoDB Atlas (cloud)
   - Create production user with limited permissions
   - Enable encryption and backups

4. **Security**:
   - Use HTTPS everywhere
   - Set secure password policies
   - Enable 2FA for admin accounts
   - Regular security audits

---

## Support & Resources

### Documentation Files
- **START_HERE.md** - Entry point for all users
- **MESS_VOICE_QUICKSTART.md** - 5-minute quick reference
- **CHAT_SYSTEM_SUMMARY.md** - Chat feature details
- **GROUPS_API.md** - Group API reference
- **CODE_REVIEW_REPORT.md** - Code quality analysis

### File Structure
```
Mess/
├── backend/
│   ├── src/main/java/com/hostel/mess/
│   │   ├── controller/
│   │   ├── service/
│   │   ├── repository/
│   │   ├── model/
│   │   ├── dto/
│   │   ├── config/
│   │   └── security/
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── data/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── Documentation files (.md)
```

---

## Questions?

Refer to the specific documentation:
- **Meal System**: README.md
- **Chat System**: CHAT_SYSTEM_SUMMARY.md
- **Groups**: GROUPS_API.md
- **Complaints**: MESS_VOICE_FEATURE.md
- **All Docs**: DOCUMENTATION_INDEX.md

---

**Created**: January 25, 2026  
**Version**: 1.0 Complete  
**Status**: ✅ Production Ready
