# 🍽️ Hostel Mess Live Menu

A web application that allows hostel students to view and update today's food menu for all meal times in real time.

## 🎯 Features

- **View Today's Menu** - See the current food items for Breakfast, Lunch, Evening Snacks, and Dinner
- **Post Menu Updates** - Select food items using image cards and post the current menu
- **Visual Food Selection** - Card-based UI with food images for easy identification
- **Real-time Updates** - Menu updates are visible to everyone immediately
- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **Meal Type Tabs** - Easy navigation between different meal types

## 🍳 Meal Types & Food Options

### Breakfast
Idli, Dosa, Poori, Upma, Pongal, Bread & Jam, Rice Bath, Vada

### Lunch
Rice, Sambar, Rasam, Chapati, Vegetable Curry, Curd, Pickle, Sweet

### Evening Snacks
Tea, Coffee, Samosa, Bajji, Bonda, Biscuits, Puff

### Dinner
Chapati, Rice, Dal, Curry, Curd, Buttermilk

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React (JavaScript), CSS |
| Backend | Spring Boot (Java 17) |
| Database | MongoDB |
| API | REST |

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Java 17** or higher - [Download](https://adoptium.net/)
- **Maven** (3.6+) - [Download](https://maven.apache.org/)
- **MongoDB** (running on localhost:27017) - [Download](https://www.mongodb.com/try/download/community)

## 🚀 Getting Started

### 1. Start MongoDB

Make sure MongoDB is running on `localhost:27017`:

```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

### 2. Start the Backend (Spring Boot)

```bash
cd backend
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`

### 3. Start the Frontend (React)

```bash
cd frontend
npm install
npm start
```

The frontend will start on `http://localhost:3000`

### 4. Open the Application

Open your browser and navigate to `http://localhost:3000`

## 📡 API Endpoints

### GET /api/meals/today/{mealType}
Fetch today's food for a given meal type.

**Parameters:**
- `mealType` - One of: `BREAKFAST`, `LUNCH`, `SNACKS`, `DINNER`

**Response:**
```json
{
  "mealType": "BREAKFAST",
  "date": "2026-01-24",
  "items": ["Idli", "Vada"],
  "postedAt": "2026-01-24T08:30:00Z"
}
```
Returns `null` if not updated.

### POST /api/meals/update
Save/Update today's food for a meal.

**Request Body:**
```json
{
  "mealType": "BREAKFAST",
  "date": "2026-01-24",
  "items": ["Idli", "Vada"]
}
```

**Response:**
```json
{
  "mealType": "BREAKFAST",
  "date": "2026-01-24",
  "items": ["Idli", "Vada"],
  "postedAt": "2026-01-24T08:30:00Z"
}
```

## 📁 Project Structure

```
Mess/
├── backend/
│   ├── src/main/java/com/hostel/mess/
│   │   ├── MessBreakfastApplication.java
│   │   ├── config/
│   │   │   └── CorsConfig.java
│   │   ├── controller/
│   │   │   └── MealController.java
│   │   ├── dto/
│   │   │   ├── MealRequest.java
│   │   │   └── MealResponse.java
│   │   ├── model/
│   │   │   └── MealUpdate.java
│   │   ├── repository/
│   │   │   └── MealRepository.java
│   │   └── service/
│   │       └── MealService.java
│   ├── src/main/resources/
│   │   └── application.properties
│   └── pom.xml
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   ├── index.css
│   │   ├── components/
│   │   │   ├── MealTabs.js
│   │   │   ├── MealTabs.css
│   │   │   ├── FoodCard.js
│   │   │   ├── FoodCard.css
│   │   │   ├── FoodGrid.js
│   │   │   ├── FoodGrid.css
│   │   │   ├── TodayMenuDisplay.js
│   │   │   └── TodayMenuDisplay.css
│   │   ├── data/
│   │   │   └── foodData.js
│   │   └── services/
│   │       └── api.js
│   └── package.json
│
└── README.md
```

## 🗄️ MongoDB Schema

**Collection:** `meal_updates`

```json
{
  "_id": "ObjectId",
  "mealType": "BREAKFAST | LUNCH | SNACKS | DINNER",
  "date": "YYYY-MM-DD",
  "items": ["Idli", "Vada"],
  "postedAt": "ISO_TIMESTAMP"
}
```

**Rules:**
- One document per `mealType` + `date` combination
- If posted again → overwrites existing record

## 🔮 Future Improvements

- Add user authentication for posting menus
- Implement rating system for food items
- Add admin panel for menu management
- Support multiple hostels
- Add push notifications for menu updates
- Historical menu data and analytics

## 📝 Notes

- MongoDB must be running on `localhost:27017`
- CORS is configured to allow requests from `http://localhost:3000`
- Food images are loaded from public URLs
- The food items list is configured in `frontend/src/data/foodData.js`

## 📄 License

This project is for educational purposes.
