# 🎯 Hostel Mess Management System - Complete System Guide

**Last Updated**: April 8, 2026  
**Status**: ✅ Production Ready with WebSocket Real-time Features  
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

#### Backend (Java Spring Boot)
- **Framework**: Spring Boot 3.2.1
- **Language**: Java 17+
- **Web Server**: Apache Tomcat (Embedded)
- **Database**: MongoDB 4.0+
- **Authentication**: JWT (JJWT)
- **Validation**: Jakarta Bean Validation
- **WebSocket**: Spring WebSocket + STOMP + SockJS
- **Build Tool**: Maven 3+
- **Task Scheduling**: Spring Scheduling

#### Frontend (React + Vite)
- **Library**: React 18.2.0
- **Build Tool**: Vite 7.1.5
- **Routing**: React Router v6 (6.20.0)
- **HTTP Client**: Axios 1.6.2
- **Real-time**: SockJS Client 1.6.1 + STOMP.js 2.3.3
- **Styling**: Tailwind CSS 3.4.17 + PostCSS
- **UI Components**: Radix UI (Avatar, Dialog, Dropdown, Tabs)
- **Icons**: Lucide React 0.543.0
- **Node**: 18+ with npm

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

---

## API Documentation

### 🔗 API Base URL
- **Local Development**: `http://localhost:8080/api`
- **Production**: `https://your-domain.com/api`

### ✅ Complete REST Endpoints (40+)

#### 🔐 Authentication (`/api/auth`)

##### Register User
```http
POST /api/auth/register
Content-Type: application/json

Request:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",      // min 6 characters
  "hostel": "Boys Hostel A"       // optional
}

Response: 201 Created
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "hostel": "Boys Hostel A",
      "role": "USER"
    }
  }
}
```

##### Login User
```http
POST /api/auth/login
Content-Type: application/json

Request:
{
  "email": "john@example.com",
  "password": "password123"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expariesIn": 86400,           // seconds (24 hours)
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "hostel": "Boys Hostel A",
      "role": "USER"
    }
  }
}
```

#### 👤 User Profile (`/api/users`)

##### Get Current User
```http
GET /api/users/me
Authorization: Bearer {token}

Response: 200 OK
{
  "id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "hostel": "Boys Hostel A",
  "roomNumber": "A101",
  "year": "2nd Year",
  "branch": "Computer Science",
  "role": "USER",
  "createdAt": "2026-01-25T12:00:00Z"
}
```

##### Get User by ID
```http
GET /api/users/{userId}

Response: 200 OK
{
  "id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "hostel": "Boys Hostel A",
  "roomNumber": "A101"
}
```

##### Update User Profile
```http
PUT /api/users/me
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "roomNumber": "A102",
  "year": "3rd Year",
  "branch": "Computer Science"
}

Response: 200 OK
{
  "success": true,
  "data": { /* updated user object */ }
}
```

#### 🍽️ Meals (`/api/meals`)

##### Get Today's Meal by Type
```http
GET /api/meals/today/{mealType}
Authorization: Bearer {token}

Path Parameter:
- mealType: "BREAKFAST" | "LUNCH" | "SNACKS" | "DINNER"

Response: 200 OK
{
  "mealType": "BREAKFAST",
  "date": "2026-01-25",
  "items": ["Idli", "Vada", "Sambar", "Chutney"],
  "postedAt": "2026-01-25T07:30:00Z",
  "confirmations": 5,
  "verificationStatus": "VERIFIED",
  "updateWindowOpen": true,
  "updateWindowMessage": "Update window open until 09:30"
}
```

##### Post/Update Today's Meal
```http
POST /api/meals/update
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "mealType": "BREAKFAST",
  "date": "2026-01-25",
  "items": ["Idli", "Vada", "Sambar"]
}

Response: 200 OK
{
  "mealType": "BREAKFAST",
  "date": "2026-01-25",
  "items": ["Idli", "Vada", "Sambar"],
  "postedAt": "2026-01-25T08:15:00Z",
  "confirmations": 1,
  "verificationStatus": "UNVERIFIED"
}
```

##### Delete Meal (Admin Only)
```http
DELETE /api/meals/admin/{mealType}/today
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "message": "Meal deleted successfully"
}
```

#### 🥣 Breakfast Specific (`/api/breakfast`)

##### Get Today's Breakfast
```http
GET /api/breakfast/today

Response: 200 OK
{
  "date": "2026-01-25",
  "items": ["Idli", "Vada", "Sambar"],
  "postedAt": "2026-01-25T07:30:00Z"
}
```

##### Update Breakfast
```http
POST /api/breakfast/update
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "date": "2026-01-25",
  "items": ["Idli", "Vada"]
}

Response: 200 OK
{
  "date": "2026-01-25",
  "items": ["Idli", "Vada"],
  "postedAt": "2026-01-25T08:15:00Z"
}
```

#### 👥 Groups (`/api/groups`)

##### Create Group
```http
POST /api/groups/create
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "name": "Night Owls"
}

Response: 201 Created
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Night Owls",
  "groupCode": "KJ9L2X4M",        // 8-char unique code
  "members": ["507f1f77bcf86cd799439011"],
  "memberCount": 1,
  "creator": "507f1f77bcf86cd799439011",
  "createdAt": "2026-01-25T12:00:00Z"
}
```

##### Join Group
```http
POST /api/groups/join
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "groupCode": "KJ9L2X4M"
}

Response: 200 OK
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Night Owls",
  "groupCode": "KJ9L2X4M",
  "members": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
  "memberCount": 2
}
```

##### Get My Groups (Paginated)
```http
GET /api/groups/my-groups?page=0&size=20
Authorization: Bearer {token}

Query Parameters:
- page: Page number (0-indexed)
- size: Items per page (max 100)

Response: 200 OK
{
  "content": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Night Owls",
      "groupCode": "KJ9L2X4M",
      "memberCount": 2
    }
  ],
  "totalPages": 1,
  "totalElements": 1,
  "currentPage": 0
}
```

##### Get All Groups (Paginated)
```http
GET /api/groups/all?page=0&size=20

Response: 200 OK
{
  "content": [ /* array of groups */ ],
  "totalPages": 5,
  "totalElements": 100,
  "currentPage": 0
}
```

##### Get Group Details
```http
GET /api/groups/{groupId}

Path Parameter:
- groupId: Group ID

Response: 200 OK
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Night Owls",
  "groupCode": "KJ9L2X4M",
  "members": ["user_1", "user_2", "user_3"],
  "memberCount": 3,
  "creator": "user_1"
}
```

#### 🍴 Group Meal Status (`/api/group-meal-status`)

##### Mark "I'm Going" to Meal
```http
POST /api/group-meal-status/going
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "groupId": "507f1f77bcf86cd799439011",
  "mealType": "LUNCH"
}

Response: 201 Created
{
  "groupId": "507f1f77bcf86cd799439011",
  "mealType": "LUNCH",
  "goingUsers": ["user_1", "user_2"],
  "goingCount": 2,
  "expiresAt": "2026-01-25T13:30:00Z"  // 30 min auto-expiry
}
```

##### Cancel Meal Attendance
```http
DELETE /api/group-meal-status/{groupId}/{mealType}
Authorization: Bearer {token}

Path Parameters:
- groupId: Group ID
- mealType: "BREAKFAST" | "LUNCH" | "SNACKS" | "DINNER"

Response: 200 OK
{
  "success": true,
  "message": "Attendance cancelled"
}
```

##### Get Group Meal Status
```http
GET /api/group-meal-status/{groupId}/{mealType}

Response: 200 OK
{
  "groupId": "507f1f77bcf86cd799439011",
  "mealType": "LUNCH",
  "goingUsers": ["user_1", "user_2"],
  "goingCount": 2
}
```

#### 💬 Chat (`/api/chat`)

##### Send Message
```http
POST /api/chat/send
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "chatType": "GROUP",                    // "GROUP" or "UNIVERSAL"
  "chatId": "507f1f77bcf86cd799439011",  // groupId for GROUP, "GLOBAL" for UNIVERSAL
  "message": "Hey everyone! Let's meet at 12 for lunch?",
  "username": "John Doe"                 // optional, uses logged-in name by default
}

Limits:
- GROUP chat: 500 characters max
- UNIVERSAL chat: 150 characters max

Response: 201 Created
{
  "id": "507f1f77bcf86cd799439012",
  "username": "John Doe",
  "message": "Hey everyone! Let's meet at 12 for lunch?",
  "timestamp": "2026-01-25T11:45:00Z",
  "chatType": "GROUP",
  "chatId": "507f1f77bcf86cd799439011"
}
```

##### Get Messages (Paginated)
```http
GET /api/chat/messages?chatType=GROUP&chatId=507f1f77bcf86cd799439011&page=0&size=20
Authorization: Bearer {token}

Query Parameters:
- chatType: "GROUP" or "UNIVERSAL"
- chatId: Group ID or "GLOBAL"
- page: Page number (0-indexed)
- size: Items per page

Response: 200 OK
{
  "content": [
    {
      "id": "507f1f77bcf86cd799439012",
      "username": "John Doe",
      "message": "Hey everyone!",
      "timestamp": "2026-01-25T11:45:00Z",
      "chatType": "GROUP"
    }
  ],
  "totalPages": 5,
  "totalElements": 87,
  "currentPage": 0
}
```

##### Delete Message (Admin Only)
```http
DELETE /api/chat/{messageId}
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "message": "Message deleted"
}
```

#### ⚠️ Complaints (`/api/complaints`)

##### Create Complaint
```http
POST /api/complaints/
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "foodItem": "Sambar",
  "mealType": "BREAKFAST",
  "complaintType": "Poor Taste",          // Options: "Poor Taste", "Quality", "Portion",
                                          //         "Temperature", "Hygiene", "Service"
  "comments": "Too salty"                 // optional
}

Response: 201 Created
{
  "id": "507f1f77bcf86cd799439013",
  "foodItem": "Sambar",
  "mealType": "BREAKFAST",
  "complaintType": "Poor Taste",
  "status": "OPEN",
  "agreeVotes": 1,
  "disagreeVotes": 0,
  "createdAt": "2026-01-25T07:45:00Z"
}
```

##### Get Today's Complaints (Paginated)
```http
GET /api/complaints/today/{mealType}?page=0&size=20
Authorization: Bearer {token}

Path Parameter:
- mealType: "BREAKFAST" | "LUNCH" | "SNACKS" | "DINNER"

Query Parameters:
- page: Page number
- size: Items per page

Response: 200 OK
{
  "content": [
    {
      "id": "507f1f77bcf86cd799439013",
      "foodItem": "Sambar",
      "mealType": "BREAKFAST",
      "complaintType": "Poor Taste",
      "status": "OPEN",
      "agreeVotes": 5,
      "disagreeVotes": 2
    }
  ],
  "totalPages": 2,
  "totalElements": 25,
  "currentPage": 0
}
```

##### Vote on Complaint
```http
POST /api/complaints/vote
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "complaintId": "507f1f77bcf86cd799439013",
  "vote": "AGREE"                         // "AGREE" or "DISAGREE"
}

Auto-verification:
- Status becomes "VERIFIED" when agreeVotes ≥ 3
- Each user votes only once per complaint

Response: 200 OK
{
  "id": "507f1f77bcf86cd799439013",
  "status": "VERIFIED",                   // Updated status
  "agreeVotes": 6,
  "disagreeVotes": 2,
  "message": "Complaint verified - 3+ agreements!"
}
```

##### Delete Complaint
```http
DELETE /api/complaints/{complaintId}
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "message": "Complaint deleted"
}
```

#### 👨‍💼 Admin (`/api/admin`)

##### Admin Login
```http
POST /api/admin/login
Content-Type: application/json

Request:
{
  "username": "admin",
  "password": "admin_password"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": "507f1f77bcf86cd799439011",
      "username": "admin",
      "role": "ADMIN",
      "fullName": "Admin User"
    }
  }
}
```

##### Admin Dashboard Stats
```http
GET /api/admin/dashboard
Authorization: Bearer {admin_token}

Response: 200 OK
{
  "totalUsers": 150,
  "totalComplaints": 45,
  "openComplaints": 12,
  "verifiedComplaints": 25,
  "totalGroups": 20,
  "totalMessages": 1250,
  "lastUpdated": "2026-01-25T12:00:00Z"
}
```

##### Get All Admins (Super Admin Only)
```http
GET /api/admin/all
Authorization: Bearer {super_admin_token}

Response: 200 OK
{
  "admins": [
    {
      "id": "507f1f77bcf86cd799439011",
      "username": "admin1",
      "role": "ADMIN",
      "fullName": "Admin One"
    }
  ]
}
```

#### 🏥 Health Check (`/api/health`)

##### Application Health
```http
GET /api/health

Response: 200 OK
{
  "status": "UP",
  "timestamp": "2026-01-25T12:00:00Z",
  "database": "Connected",
  "uptime": "5h 30m"
}
```

---

### 🔌 WebSocket Real-time Chat

#### STOMP over SockJS Connection
```javascript
// Client Setup
const stompClient = new StompClient();
stompClient.connect(
  'http://localhost:8080/ws',
  { Authorization: `Bearer ${token}` },
  onConnect,
  onError
);
```

#### Subscribe to Chat Topics

**Group Chat:**
```javascript
stompClient.subscribe(
  '/topic/chat/GROUP/groupId123',
  messageHandler
);
```

**Community Chat:**
```javascript
stompClient.subscribe(
  '/topic/chat/UNIVERSAL/GLOBAL',
  messageHandler
);
```

#### Send Message via WebSocket
```javascript
stompClient.send(
  '/app/chat/send',
  {},
  JSON.stringify({
    chatType: 'GROUP',
    chatId: 'groupId123',
    message: 'Real-time message!',
    username: 'John Doe'
  })
);
```

#### WebSocket Message Format
```javascript
{
  id: "507f1f77bcf86cd799439012",
  username: "John Doe",
  message: "Real-time message!",
  timestamp: "2026-01-25T11:45:00Z",
  chatType: "GROUP",
  chatId: "groupId123"
}
```

---

## Frontend Components

### Component Tree Structure

```
src/
├── App.jsx                              # Main routing component
├── main.jsx                             # React entry point
├── index.css                            # Global styles (Tailwind)
│
├── components/
│   ├── WebSocketStatus.jsx              # Real-time status indicator
│   ├── WEBSOCKET_INTEGRATION_EXAMPLES.jsx  # WebSocket examples
│   │
│   ├── daily-meal/                      # Breakfast/Meal selection
│   │   ├── BreakfastPostedSection.jsx   # Display posted breakfast
│   │   ├── FoodSelectionGrid.jsx        # Grid UI for food selection
│   │   ├── SelectedItemsBar.jsx         # Selected items display
│   │   └── UpdateBreakfastButton.jsx    # Submit breakfast button
│   │
│   ├── dashboard/                       # Main dashboard widgets
│   │   ├── community-chat-preview.jsx   # Real-time chat preview
│   │   ├── empty-state.jsx              # Empty state placeholder
│   │   ├── group-voting-section.jsx     # Food complaint voting
│   │   ├── quick-stats-grid.jsx         # Stats display grid
│   │   ├── recent-feedback-table.jsx    # Recent complaints table
│   │   └── todays-menu-card.jsx         # Today's menu card widget
│   │
│   ├── layout/
│   │   ├── app-sidebar.jsx              # Left navigation sidebar
│   │   └── top-navbar.jsx               # Top header bar
│   │
│   └── ui/                              # Reusable Radix UI components
│       ├── avatar.jsx                   # User avatar component
│       ├── badge.jsx                    # Badge/tag component
│       ├── button.jsx                   # Button component
│       ├── card.jsx                     # Card container
│       ├── dialog.jsx                   # Modal dialog
│       ├── dropdown-menu.jsx            # Dropdown menu
│       ├── input.jsx                    # Input field
│       ├── skeleton.jsx                 # Loading skeleton
│       ├── table.jsx                    # Table component
│       └── tabs.jsx                     # Tab component
│
├── pages/                               # Route pages
│   ├── dashboard-page.jsx               # Main app dashboard (protected)
│   ├── group-detail-page.jsx            # Group chat & members
│   ├── groups-page.jsx                  # Groups list & manage
│   └── login-page.jsx                   # Login/register page
│
├── layouts/
│   └── dashboard-layout.jsx             # Main layout wrapper
│
├── services/                            # API & business logic
│   ├── api-client.js                    # Axios instance + JWT interceptor
│   ├── auth-service.js                  # Authentication methods
│   ├── mess-api.js                      # All API endpoints
│   └── websocket-service.js             # STOMP WebSocket management
│
├── hooks/
│   └── useWebSocket.js                  # React hook for WebSocket
│
├── context/
│   └── theme-context.jsx                # Theme (dark/light) context
│
├── config/
│   └── navigation.js                    # Navigation routes config
│
├── data/
│   └── food-options.js                  # Default food lists
│
└── lib/
    └── utils.js                         # Utility functions
```

### Core Components Details

#### 📄 Page Components

**LoginPage.jsx**
- User registration form
- User login form
- Admin login option
- Form validation
- Token storage on success

**DashboardPage.jsx**
- Main authenticated dashboard
- Displays all meal types (BREAKFAST, LUNCH, SNACKS, DINNER)
- Integrated components:
  - Today's menu display
  - Food selection grid
  - Posted items section
  - Community chat preview
  - Group voting section
  - Feedback table
  - Quick stats

**GroupsPage.jsx**
- List all user's groups with pagination
- Create group dialog
- Join group dialog
- Group card UI with member count
- Real-time updates via WebSocket

**GroupDetailPage.jsx**
- Group chat interface
- Group members list
- Meal attendance tracking
- Mark "going" status
- View meal status for group

#### 🎨 Dashboard Components

**community-chat-preview.jsx**
- Real-time message display
- Message input with character count (150 max)
- WebSocket integration
- Scrollable message list
- Timestamp display

**group-voting-section.jsx**
- Shows today's complaints
- Voting interface (AGREE/DISAGREE)
- Status indicator (OPEN, VERIFIED, REJECTED)
- Vote count display
- Real-time vote updates

**todays-menu-card.jsx**
- Displays current meal type
- Shows items array
- Verification status badge
- Confirmation count
- Time window indicator

**quick-stats-grid.jsx**
- Total users in system
- Active groups count
- Total complaints
- Recent messages count
- Helps users understand system activity

**recent-feedback-table.jsx**
- Lists recent complaints
- Shows food item, type, complaint category
- Vote counts
- Status badges
- Sortable by date

#### 🍽️ Meal Components

**FoodSelectionGrid.jsx**
- Grid of food items (predefined list)
- Toggle selection with click
- Visual feedback (highlight on select)
- Responsive grid layout
- Item counts

**SelectedItemsBar.jsx**
- Shows currently selected foods
- Remove button for each item
- Clear all option
- Count display

**BreakfastPostedSection.jsx**
- Displays posted breakfast items
- Shows posting timestamp
- Posted by user info
- Confirmation count

**UpdateBreakfastButton.jsx**
- Submit breakfast items
- Confirmation dialog
- Loading state
- Success/error handling

#### 💬 Communication Components

**WebSocketStatus.jsx**
- Shows connection status
- Green (connected) / Red (disconnected)
- Reconnection indicator
- Connection stats

### Layout Components

**top-navbar.jsx**
- User profile dropdown
- Logout button
- App branding
- Notification center (future)

**app-sidebar.jsx**
- Navigation links
- Group shortcuts
- Meal type selector
- Theme toggle
- Mobile responsive

### UI Component Library (Radix + Shadcn)

**Re-usable Components**:
- `<Button>` - All buttons with variants
- `<Card>` - Container + header + footer
- `<Input>` - Form inputs with labels
- `<Tabs>` - Tab navigation
- `<Dialog>` - Modal dialogs
- `<DropdownMenu>` - Context menus
- `<Table>` - Data tables
- `<Avatar>` - User avatars
- `<Badge>` - Status badges
- `<Skeleton>` - Loading placeholders

---

## Frontend Services & Hooks

### 🔌 Services

#### api-client.js
```javascript
// Axios instance with JWT interceptor
export const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api'
});

// Automatically adds Authorization header
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('messApp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

#### auth-service.js
```javascript
// Authentication operations
- register(name, email, password, hostel)
- login(email, password)
- logout()
- getStoredUser()
- getStoredToken()
- isAuthenticated()
- updateUser(userId, data)
```

#### mess-api.js
```javascript
// All mess-related API calls (20+ methods)
- getMealsByType(mealType)
- postMealUpdate(mealType, items)
- createGroup(name)
- joinGroup(groupCode)
- getMyGroups(page, size)
- getAllGroups(page, size)
- sendMessage(chatType, chatId, message)
- getMessages(chatType, chatId, page)
- createComplaint(foodItem, mealType, complaintType, comments)
- voteOnComplaint(complaintId, vote)
- getTodaysComplaints(mealType, page)
- markAsGoing(groupId, mealType)
- getGroupMealStatus(groupId, mealType)
```

#### websocket-service.js
```javascript
// WebSocket management
- connect(token, onConnect, onError)
- subscribe(destination, callback)
- send(destination, message)
- disconnect()
- isConnected()

// Auto-subscribes to:
// - /topic/chat/GROUP/{groupId}
// - /topic/chat/UNIVERSAL/GLOBAL
```

### 🎣 Custom Hooks

#### useWebSocket.js
```javascript
// WebSocket connection management
const {
  isConnected,
  messages,
  sendMessage,
  subscribe,
  unsubscribe
} = useWebSocket();

// Features:
// - Auto-reconnect on disconnect
// - Message buffering
// - Memory cleanup
// - Error handling
```

### 📊 Data & Utils

#### food-options.js
```javascript
export const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];

export const COMMON_FOODS_BY_MEAL = {
  BREAKFAST: ['Idli', 'Vada', 'Dosa', 'Sambar', 'Chutney', ...],
  LUNCH: ['Rice', 'Chapati', 'Curry', 'Vegetables', ...],
  SNACKS: ['Biscuits', 'Chai', 'Juice', ...],
  DINNER: ['Bread', 'Vegetables', 'Dairy', ...]
};
```

#### utils.js
```javascript
// Tailwind classname merger
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```



---

## Database Schema

### Collections Overview (8 Collections)

#### 1️⃣ Users Collection
```javascript
{
  _id: ObjectId,
  name: String,                    // User's full name
  email: String,                   // Unique email
  password: String,                // BCrypt hashed
  hostel: String,                  // Hostel name (e.g., "Boys Hostel A")
  roomNumber: String,              // Room number (optional)
  year: String,                    // Academic year
  branch: String,                  // Academic branch/stream
  role: String,                    // "USER" or "ADMIN"
  createdAt: ISODate
}

// Indexes:
// { email: 1 } - Unique index
```

#### 2️⃣ Groups Collection
```javascript
{
  _id: ObjectId,
  name: String,                    // Group name (e.g., "Night Owls")
  groupCode: String,               // 8-char unique code (e.g., "KJ9L2X4M")
  members: [String],               // Array of user IDs
  creator: String,                 // Creator user ID
  createdAt: ISODate
}

// Indexes:
// { groupCode: 1 } - Unique compound index
```

#### 3️⃣ ChatMessages Collection
```javascript
{
  _id: ObjectId,
  chatType: String,                // "GROUP" or "UNIVERSAL"
  chatId: String,                  // Group ID for GROUP, "GLOBAL" for UNIVERSAL
  senderId: String,                // User ID who sent message
  username: String,                // Sender's username display
  message: String,                 // Message content (max 500 GROUP, 150 UNIVERSAL)
  timestamp: ISODate,              // When sent
  createdAt: ISODate,              // Document creation time
  expiresAt: ISODate               // For TTL index (24h UNIVERSAL only)
}

// Indexes:
// { chatType: 1, chatId: 1, timestamp: -1 } - Compound for fetching
// { expiresAt: 1 }, { expireAfterSeconds: 86400 } - TTL for UNIVERSAL only
```

#### 4️⃣ MealUpdates Collection
```javascript
{
  _id: ObjectId,
  mealType: String,                // "BREAKFAST" | "LUNCH" | "SNACKS" | "DINNER"
  date: String,                    // "YYYY-MM-DD" format
  items: [String],                 // Array of food items (e.g., ["Idli", "Vada"])
  postedAt: ISODate,               // When meal was posted
  confirmations: Number,           // Count of users confirming
  verificationStatus: String,      // "UNVERIFIED" | "VERIFIED" | "UNCERTAIN"
  createdAt: ISODate
}

// Indexes:
// { mealType: 1, date: 1 } - Compound index
```

#### 5️⃣ BreakfastUpdates Collection
```javascript
{
  _id: ObjectId,
  date: String,                    // "YYYY-MM-DD" format
  items: [String],                 // Breakfast items array
  postedAt: ISODate,               // Posting timestamp
  createdAt: ISODate
}

// Specialized collection for breakfast tracking
```

#### 6️⃣ Complaints Collection
```javascript
{
  _id: ObjectId,
  foodItem: String,                // Which food the complaint is about
  mealType: String,                // "BREAKFAST" | "LUNCH" | "SNACKS" | "DINNER"
  complaintType: String,           // One of: "Poor Taste", "Quality", "Portion", 
                                   //        "Temperature", "Hygiene", "Service"
  userId: String,                  // Who raised complaint
  comments: String,                // Additional comments (optional)
  status: String,                  // "OPEN" | "RESOLVED" | "REJECTED"
  agreeVotes: Number,              // Count of agreements (threshold: 3+)
  disagreeVotes: Number,           // Count of disagreements
  voters: {
    [userId]: String               // "AGREE" or "DISAGREE" per user
  },
  createdAt: ISODate
}

// Indexes:
// { mealType: 1, date: 1 } - For daily complaints
```

#### 7️⃣ GroupMealStatus Collection
```javascript
{
  _id: ObjectId,
  groupId: String,                 // Reference to group
  mealType: String,                // "BREAKFAST" | "LUNCH" | "SNACKS" | "DINNER"
  goingUsers: [String],            // Array of user IDs marking "I'm going"
  goingCount: Number,              // Count of going users
  expiresAt: ISODate,              // Auto-delete after 30 minutes
  createdAt: ISODate
}

// Indexes:
// { expiresAt: 1 }, { expireAfterSeconds: 1800 } - TTL 30 minutes
```

#### 8️⃣ Admins Collection
```javascript
{
  _id: ObjectId,
  username: String,                // Admin username (unique)
  password: String,                // BCrypt hashed
  role: String,                    // "ADMIN" | "SUPER_ADMIN"
  fullName: String,                // Admin's full name
  createdAt: ISODate
}

// Indexes:
// { username: 1 } - Unique index
```

---

## Backend Implementation Details

### Controllers (12 Total)

**AuthController.java** (`/api/auth`)
- POST /register - User registration
- POST /login - User authentication
- Generates JWT tokens on successful login

**UserController.java** (`/api/users`)
- GET /me - Current user info
- GET /{userId} - Public profile
- PUT /me - Update profile

**MealController.java** (`/api/meals`)
- GET /today/{mealType} - Get meal by type
- POST /update - Post/update meal
- DELETE /admin/{mealType}/today - Admin delete

**BreakfastController.java** (`/api/breakfast`)
- GET /today - Get breakfast
- POST /update - Update breakfast

**GroupController.java** (`/api/groups`)
- POST /create - Create group
- POST /join - Join group
- GET /my-groups - User's groups (paginated)
- GET /all - All groups (paginated)
- GET /{groupId} - Group details

**GroupMealStatusController.java** (`/api/group-meal-status`)
- POST /going - Mark as going
- DELETE /{groupId}/{mealType} - Cancel
- GET /{groupId}/{mealType} - Status

**ChatController.java** (`/api/chat`)
- POST /send - Send message
- GET /messages - Get messages (paginated)
- DELETE /{messageId} - Delete message

**ChatWebSocketController.java** (WebSocket)
- Handles STOMP message subscriptions
- Real-time message broadcasting

**ComplaintController.java** (`/api/complaints`)
- POST / - Create complaint
- GET /today/{mealType} - Today's complaints
- POST /vote - Vote on complaint
- DELETE /{complaintId} - Delete complaint

**AdminController.java** (`/api/admin`)
- POST /login - Admin authentication
- GET /dashboard - Dashboard stats
- GET /all - List all admins (Super Admin only)

**HealthController.java** (`/api/health`)
- GET /health - Application health check

**WebSocketController.java**
- Manages WebSocket connections
- STOMP endpoint: /ws

### Services (9 Total)

**AuthService.java**
- User registration with BCrypt hashing
- Login with JWT token generation
- Token validation
- Role assignment (USER/ADMIN)

**UserService.java**
- User profile management
- Update user info
- Get user by ID

**MealService.java**
- Post meal updates
- Retrieve current meal
- Verification status tracking
- Confirmation count management

**GroupService.java**
- Create groups with unique 8-char codes
- Join groups
- List user groups with pagination
- Member management
- Code generation algorithm

**GroupMealStatusService.java**
- Track "going" status for meals
- Auto-expiry after 30 minutes
- Group-based attendance

**ChatService.java**
- Send messages (GROUP/UNIVERSAL)
- Retrieve messages with pagination
- Delete messages (admin)
- TTL management (24h for UNIVERSAL)

**ComplaintService.java**
- Create complaints
- Vote system (AGREE/DISAGREE)
- Status auto-update (3+ votes = VERIFIED)
- Prevent duplicate votes
- Query day-based complaints

**AdminService.java**
- Admin authentication
- Dashboard stats computation
- Admin user management

**WebSocketEventPublisher.java**
- Real-time event broadcasting
- Message distribution to subscribed clients

### Repositories (8 Total - MongoDB)

**UserRepository.java**
```java
findByEmail(String email)
existsByEmail(String email)
// Standard Spring Data MongoDB operations
```

**GroupRepository.java**
```java
findByGroupCode(String groupCode)
findByMembers(String userId)
// Pagination support
```

**ChatMessageRepository.java**
```java
findByChatTypeAndChatId(String chatType, String chatId)
// Pagination + sorting by timestamp
// TTL index for auto-deletion
```

**MealRepository.java**
```java
findByMealTypeAndDate(String mealType, String date)
// Compound index: mealType, date
```

**ComplaintRepository.java**
```java
findByMealTypeAndDate(String mealType, String date)
findById(String complaintId)
// Pagination support
```

**GroupMealStatusRepository.java**
```java
findByGroupIdAndMealType(String groupId, String mealType)
// TTL index: 30-minute expiration
```

**BreakfastRepository.java**
```java
findByDate(String date)
```

**AdminRepository.java**
```java
findByUsername(String username)
```

### Security Layer

**JwtTokenProvider.java**
- Token generation with userId, username, role
- Token validation and parsing
- 24-hour expiration
- Secure secret key management

**JwtAuthenticationFilter.java**
- Extracts JWT from Authorization header
- Validates token signature
- Sets authenticated principal
- Returns 401 for invalid tokens

**CustomUserDetailsService.java**
- Loads user by email
- Returns UserDetails for Spring Security

**WebSocketAuthenticationHandler.java**
- JWT validation for WebSocket connections
- Secure STOMP handshake

### Configuration

**SecurityConfig.java**
```java
- CORS configuration (localhost:3000)
- JWT filter registration
- Protected endpoint definitions
- CSRF disabled for API
- Session management (STATELESS)
```

**WebSocketConfig.java**
```java
- STOMP endpoint: /ws
- Application destination prefix: /app
- Broker configuration
- SockJS fallback enabled
```

**CorsConfig.java**
```java
- Allowed origins: localhost:3000
- Allowed methods: GET, POST, PUT, DELETE, OPTIONS
- Allowed headers: Authorization, Content-Type
- Credentials: true
```

**CleanupScheduler.java**
```java
- Scheduled tasks for data cleanup
- TTL enforcement for expired records
- Database maintenance tasks
```

### DTOs (Data Transfer Objects - 19 Total)

**Authentication DTOs**
- LoginRequest - email, password
- LoginResponse - token, expiresIn, user
- RegisterRequest - name, email, password, hostel
- AdminLoginRequest - username, password
- AdminLoginResponse - token, admin info

**User DTOs**
- UserInfo - id, name, email, hostel, roomNumber, year, branch

**Meal DTOs**
- MealRequest - mealType, date, items
- MealResponse - full meal with status
- BreakfastRequest - date, items
- BreakfastResponse - with posting info

**Group DTOs**
- GroupResponse - id, name, code, members, count

**Chat DTOs**
- ChatRequest - chatType, chatId, message
- ChatResponse - message with metadata

**Complaint DTOs**
- ComplaintRequest - foodItem, mealType, type, comments
- ComplaintResponse - with vote counts

**Other DTOs**
- ApiResponse - Generic wrapper {success, message, data}
- CursorPaginatedResponse - nextCursor-based pagination
- PaginatedResponse - Offset-based pagination {content, totalPages, totalElements}
- GroupMealStatusResponse - Group attendance info

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

### Project Structure & Organization

#### Backend Directory Layout
```
backend/
├── pom.xml                          # Maven configuration
├── src/main/java/com/hostel/mess/
│   ├── MessBreakfastApplication.java     # Application entry point
│   ├── config/                           # Configuration classes (4)
│   ├── controller/                       # REST controllers (12)
│   ├── dto/                              # Data transfer objects (19)
│   ├── model/                            # Entity models (8)
│   ├── repository/                       # Database repositories (8)
│   ├── security/                         # Security implementation (4)
│   └── service/                          # Business logic (9)
├── src/main/resources/
│   └── application.properties            # Configuration file
└── target/                               # Build output
```

#### Frontend Directory Layout
```
frontend/
├── package.json                     # Node dependencies
├── vite.config.js                   # Vite configuration
├── postcss.config.js                # PostCSS for Tailwind
├── tailwind.config.js               # Tailwind configuration
├── index.html                       # HTML entry point
└── src/
    ├── App.jsx                      # Main component
    ├── main.jsx                     # React entry point
    ├── index.css                    # Global Tailwind styles
    ├── components/                  # React components (20+)
    ├── pages/                       # Route pages (4)
    ├── services/                    # API & business logic
    ├── hooks/                       # Custom React hooks
    ├── context/                     # React context
    ├── config/                      # Configuration
    ├── data/                        # Static data
    └── lib/                         # Utility functions
```

### Adding a New Feature (Step-by-Step)

#### 1. Backend Feature Addition

**Create Entity Model** (`src/main/java/com/hostel/mess/model/`)
```java
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.annotation.Id;

@Document(collection = "my_collection")
public class MyEntity {
    @Id
    private String id;
    
    private String name;
    private LocalDateTime createdAt;
    
    // Getters & setters
}
```

**Create Repository** (`src/main/java/com/hostel/mess/repository/`)
```java
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface MyEntityRepository extends MongoRepository<MyEntity, String> {
    Optional<MyEntity> findByName(String name);
}
```

**Create Service** (`src/main/java/com/hostel/mess/service/`)
```java
@Service
public class MyEntityService {
    @Autowired
    private MyEntityRepository repository;
    
    public MyEntity create(MyEntity entity) {
        return repository.save(entity);
    }
    
    public MyEntity findById(String id) {
        return repository.findById(id).orElse(null);
    }
}
```

**Create DTOs** (`src/main/java/com/hostel/mess/dto/`)
```java
public class MyEntityRequest {
    private String name;
    // Getters & setters
}

public class MyEntityResponse {
    private String id;
    private String name;
    private LocalDateTime createdAt;
    // Getters & setters
}
```

**Create Controller** (`src/main/java/com/hostel/mess/controller/`)
```java
@RestController
@RequestMapping("/api/my-entity")
public class MyEntityController {
    @Autowired
    private MyEntityService service;
    
    @PostMapping("/create")
    public ResponseEntity<ApiResponse> create(@RequestBody MyEntityRequest request) {
        var entity = service.create(new MyEntity(request.getName()));
        return ResponseEntity.ok(new ApiResponse(true, "Created", entity));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<MyEntity> get(@PathVariable String id) {
        return ResponseEntity.ok(service.findById(id));
    }
}
```

#### 2. Frontend Feature Addition

**Create Component** (`frontend/src/components/`)
```jsx
import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api-client';

export function MyComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/my-entity/123');
        setData(response.data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  return (
    <div>
      {loading && <span>Loading...</span>}
      {data && <div>{data.name}</div>}
    </div>
  );
}
```

**Add API Method** (`frontend/src/services/mess-api.js`)
```javascript
export const myEntityApi = {
  create: (data) => apiClient.post('/my-entity/create', data),
  get: (id) => apiClient.get(`/my-entity/${id}`),
  list: () => apiClient.get('/my-entity/all')
};
```

**Update Routing** (`frontend/src/App.jsx`)
```jsx
import MyComponent from './components/MyComponent';

<Route path="/my-feature" element={<MyComponent />} />
```

#### 3. Database Configuration

**Add Indexes**
```java
// In MongoRepository interface or configuration
@Document(collection = "my_collection")
@NoArgsConstructor
public class MyEntity {
    @Indexed(unique = true)
    private String email;
    
    @Indexed
    private String status;
}
```

**TTL Index** (for auto-expiring documents):
```java
@Document(collection = "temporary_data")
public class TemporaryData {
    @Indexed(expireAfter = "PT30M")  // 30 minutes
    private LocalDateTime expiresAt;
}
```

### Code Standards & Best Practices

#### Backend
- Use dependency injection (@Autowired, @Inject)
- Follow REST conventions (/api/resource)
- Return ApiResponse wrapper
- Implement pagination for large datasets
- Use proper HTTP status codes
- Validate all input with annotations
- Handle exceptions globally

#### Frontend
- Use functional components with hooks
- Keep components small and focused
- Use custom hooks for reusable logic
- Implement error boundaries
- Show loading states
- Use consistent naming conventions
- Prop validation with PropTypes (optional)

### Debugging & Troubleshooting

**Backend Logs**
```bash
# View logs in real-time
tail -f target/logs/spring.log

# Or enable debug mode in application.properties
logging.level.com.hostel.mess=DEBUG
logging.level.org.springframework.security=DEBUG
logging.level.org.springframework.data.mongodb=DEBUG
```

**Frontend Debugging**
```javascript
// Check JWT token
console.log('Token:', localStorage.getItem('messApp_token'));

// Check user info
console.log('User:', localStorage.getItem('messApp_user'));

// API debugging
apiClient.interceptors.response.use(
  response => { console.log('Response:', response); return response; },
  error => { console.error('API Error:', error); return Promise.reject(error); }
);
```

**MongoDB Inspection**
```bash
# Connect to MongoDB
mongosh

# List all collections
show collections

# Query specific collection with pagination
db.mealUpdate.find().limit(10).skip(0)

# Check TTL indexes
db.chatMessages.getIndexes()

# Count documents by status
db.complaints.countDocuments({ status: "OPEN" })

# Analyze collection size
db.mealUpdate.stats()
```

**Network Debugging**
```javascript
// Browser DevTools → Network tab
// Filter by API calls
// Check headers, payload, response
// Verify Content-Type and Authorization

// Frontend → Console tab
// Check console errors
// Verify CORS headers in response
```

### Testing Tips

**Manual Testing Checklist**
- [ ] User registration works
- [ ] JWT token is stored in localStorage
- [ ] Protected routes require token
- [ ] Meal updates display correctly
- [ ] Group creation succeeds
- [ ] Chat messages send/receive
- [ ] WebSocket connection works
- [ ] Complaints voting updates
- [ ] Admin endpoints are protected

**API Testing with cURL**
```bash
# Register user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"test123","hostel":"Hostel A"}'

# Get meal with token
curl -X GET "http://localhost:8080/api/meals/today/BREAKFAST" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create complaint
curl -X POST "http://localhost:8080/api/complaints/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"foodItem":"Rice","mealType":"LUNCH","complaintType":"Poor Taste"}'
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] All tests pass
- [ ] No console errors
- [ ] No sensitive data in code
- [ ] Environment variables configured
- [ ] Database backups set up
- [ ] HTTPS/SSL certificates ready
- [ ] Monitoring/logging configured
- [ ] CORS origins updated
- [ ] JWT secret changed
- [ ] Admin credentials changed

### Backend Deployment

**Build Production JAR**
```bash
cd backend
mvn clean package -DskipTests

# Output: target/mess-breakfast-1.0.0.jar
```

**Deploy to Server**
```bash
# Copy JAR to server
scp target/mess-breakfast-1.0.0.jar user@server:/app/

# Connect to server and run
ssh user@server
cd /app
java -jar mess-breakfast-1.0.0.jar \
  --spring.data.mongodb.uri=mongodb+srv://user:pass@cluster.mongodb.net/hostel_mess \
  --server.port=8080 \
  --server.servlet.context-path=/api
```

**Environment Configuration** (`application.properties`)
```properties
# MongoDB
spring.data.mongodb.uri=mongodb+srv://user:password@cluster.mongodb.net/database

# JWT
jwt.secret=your-super-secret-key-should-be-very-long-random-string
jwt.expiration=86400000

# Server
server.port=8080
server.servlet.context-path=/api

# Logging
logging.level.root=WARN
logging.level.com.hostel.mess=INFO
logging.file.name=/var/log/mess-app/app.log
```

### Frontend Deployment

**Build Production Build**
```bash
cd frontend
npm run build

# Output: dist/ directory (contains optimized files)
```

**Deploy to Hosting**

**Option 1: Vercel (Recommended)**
```bash
npm install -g vercel
vercel
# Follow prompts and connect to your domain
```

**Option 2: Netlify**
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

**Option 3: GitHub Pages**
```bash
# Add to vite.config.js
export default {
  base: '/hostel-mess/'
}

npm run build
# Deploy dist/ to gh-pages branch
```

**Update API Base URL for Production**
```javascript
// frontend/src/services/api-client.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.yourdomain.com';
```

### Database Setup (MongoDB Atlas)

1. Create MongoDB Atlas cluster
2. Add IP whitelist
3. Create database user
4. Get connection string
5. Update in application.properties

```
mongodb+srv://username:password@cluster-name.mongodb.net/database-name
```

### Security Hardening

**HTTPS/SSL**
```bash
# Get certificate from Let's Encrypt
certbot certonly --standalone -d yourdomain.com
```

**JWT Secret Management**
```bash
# Generate strong secret
openssl rand -base64 32
```

**Update CORS** (`SecurityConfig.java`)
```java
.cors(cors -> cors.configurationSource(request -> {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(Arrays.asList("https://yourdomain.com"));
    config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE"));
    return config;
}))
```

**Database Security**
```bash
# Create limited-scope MongoDB user
# Don't use admin account in production
```

### Monitoring & Logging

**Application Logs**
```bash
# Check real-time logs
tail -f /var/log/mess-app/app.log

# Aggregate logs with tools like ELK Stack or Datadog
```

**Performance Monitoring**
- Use tools like:
  - New Relic
  - Datadog
  - Sentry (for error tracking)
  - CloudWatch (AWS)

**Database Monitoring**
```bash
# MongoDB Atlas has built-in monitoring
# Check:
# - Query performance
# - Disk usage
# - Connection count
```

### Backup & Recovery

**MongoDB Backup**
```bash
# Automated backups on MongoDB Atlas
# Or manual backup:
mongodump --uri="mongodb+srv://..." --out=/backup
```

**Database Restore**
```bash
mongorestore --uri="mongodb+srv://..." ./backup
```

---

## Performance Optimization

### Backend Optimization

**Implement Caching**
```java
@Cacheable("meals")
public Meal getMeal(String mealType, String date) {
    return repository.findByMealTypeAndDate(mealType, date);
}
```

**Add Pagination**
```java
@GetMapping("/list")
public Page<MyEntity> list(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
) {
    return repository.findAll(PageRequest.of(page, size));
}
```

**Database Indexes**
```java
// Compound index for frequent queries
@Indexed(unique = false)
@CompoundIndex(name = "date_type_index", def = "{ 'date': 1, 'mealType': 1 }")
```

### Frontend Optimization

**Lazy Loading Components**
```jsx
const MyComponent = lazy(() => import('./MyComponent'));

<Suspense fallback={<Skeleton />}>
  <MyComponent />
</Suspense>
```

**Memoization**
```jsx
const Memoized = memo(MyComponent, (prevProps, nextProps) => 
  prevProps.id === nextProps.id
);
```

**Code Splitting**
```jsx
// Vite automatically splits at route boundaries
// Configure in vite.config.js if needed
```

### Network Optimization

**API Response Compression**
```java
// Add to application.properties
server.compression.enabled=true
server.compression.min-response-size=1024
```

**CDN for Static Assets**
```javascript
// Update image/asset URLs to CDN
const CDN_URL = 'https://cdn.yourdomain.com';
```

---

## Support & Resources

### Documentation Files
- **START_HERE.md** - Quick start guide
- **PROJECT_STRUCTURE.md** - Detailed file organization
- **WEBSOCKET_IMPLEMENTATION.md** - Real-time features
- **DEPLOYMENT_CHECKLIST.md** - Deployment steps
- **AUTHENTICATION_REMOVAL_SUMMARY.md** - Auth changes

### External Resources
- Spring Boot: https://spring.io/projects/spring-boot
- React: https://react.dev
- MongoDB: https://docs.mongodb.com
- Tailwind CSS: https://tailwindcss.com

### Getting Help
- Check existing GitHub issues
- Review error messages in logs
- Test endpoints with Postman
- Use browser DevTools for frontend debugging
- Check MongoDB Atlas monitoring for database issues

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
