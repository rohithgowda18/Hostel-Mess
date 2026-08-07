# 🍽️ Hostel Mess Live Menu Coordination System

A production-grade, democracy-driven web application built with **Spring Boot** and **React** that allows hostel students to view, coordinate, and update today's food menu for all meal times in real time. It features private coordination groups, feedback voting, chat capabilities, and meal photo uploads.

---

## 📖 Deep-Dive Subsystem Documentation Index

For exhaustive developer guides and specifications on each architecture layer, refer to the following documents in the `docs` folder:

*   💻 **[Frontend Architecture Guide (docs/FRONTEND.md)](file:///c:/Users/rohit/Desktop/study/projects/Mess/docs/FRONTEND.md)**: Details on the React + Vite single page application, Radix UI component states, Tailwind CSS variables, theme switching contexts, routing config, and API services integration.
*   ⚙️ **[Backend Service Guide (docs/BACKEND.md)](file:///c:/Users/rohit/Desktop/study/projects/Mess/docs/BACKEND.md)**: Explanations of Spring Boot REST controllers, controller parameters, business logic service beans, schedules for expired records cleanup, and file uploads.
*   🔐 **[Security Design Guide (docs/SECURITY.md)](file:///c:/Users/rohit/Desktop/study/projects/Mess/docs/SECURITY.md)**: Explains the Spring Security filters, stateless session handling, BCrypt hashing mechanism, custom JWT token validation, and CORS configurations.
*   🗄️ **[Database Specifications (docs/DATABASE.md)](file:///c:/Users/rohit/Desktop/study/projects/Mess/docs/DATABASE.md)**: Details on the MongoDB schemas, unique compound indexes, Repository interfaces, and document structure examples.

---

## 🎯 Core Features

- **Live Menu Management**: Displays real-time meal items (Breakfast, Lunch, Snacks, Dinner) with validation badges.
- **Buddy Groups**: Create/join groups with unique 8-character codes to coordinate dining schedules.
- **Group Meal Status**: Signal if you are "going" to a meal with automated 30-minute status expiry.
- **Chat System**: Includes Universal Community Chat (public) and private Group Chat for individual buddy groups.
- **Mess Voice (Complaints)**: Democracy-driven feedback system where students vote (AGREE/DISAGREE) on food quality issues.
- **Student Photo Submissions**: Multi-image photo uploads showing actual mess food items.

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
Create `.env` inside `frontend/` (using `frontend/.env.example` as a template):
```env
VITE_API_BASE=http://localhost:8080/api
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
The dev server will run on `http://localhost:3000`.
