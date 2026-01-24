# Hostel Mess Live Menu - Copilot Instructions

## Project Overview
A real-time hostel mess menu application with a React frontend (localhost:3000) and Spring Boot backend (localhost:8080) communicating via REST APIs. Users view meal menus by type (BREAKFAST, LUNCH, SNACKS, DINNER) and update them with selected food items stored in MongoDB.

## Architecture
- **Frontend**: React with component-based UI (MealTabs, FoodGrid, TodayMenuDisplay)
- **Backend**: Spring Boot with Service/Controller/Repository pattern (Java 17)
- **Database**: MongoDB storing `MealUpdate` documents with meal type, date, items array, and verification status
- **Cross-stack**: Axios for HTTP (fronted proxy: `http://localhost:8080`), CORS configured for localhost:3000 and GitHub Pages

## Key Patterns

### Meal Type Constants
- Always uppercase: `BREAKFAST`, `LUNCH`, `SNACKS`, `DINNER`
- Frontend helper: `getMealDisplayName()` in `foodData.js` converts to display names
- Backend time windows defined in `MealService.MEAL_TIME_WINDOWS` map with LocalTime constraints

### Data Flow
1. Frontend calls `api.getTodayMeal(mealType)` → GET `/api/meals/today/{mealType}`
2. Backend queries MongoDB for mealType + today's date (yyyy-MM-dd format)
3. Response includes: `mealType`, `date`, `items[]`, `postedAt`, `confirmations`, `verificationStatus`, `updateWindowMessage`
4. User selects items via FoodCard toggles → calls `api.updateMeal(mealType, date, items)` → POST `/api/meals/update`

### Verification System
- `VERIFICATION_THRESHOLD = 3` confirmations in `MealService`
- Status values: `UNVERIFIED`, `VERIFIED`, `UNCERTAIN`
- Verify logic in `MealService.updateMeal()` (line ~100)
- **Note**: `DISABLE_TIME_RESTRICTIONS = true` in MealService for testing purposes

### Time Windows (Testing-Disabled)
- BREAKFAST: 07:00-09:30
- LUNCH: 12:00-14:30
- SNACKS: 16:30-18:00
- DINNER: 19:30-21:30
- Currently bypassed; enable by setting `DISABLE_TIME_RESTRICTIONS = false`

## File Organization

### Backend Structure (`backend/src/main/java/com/hostel/mess/`)
- `controller/MealController.java` - Two endpoints: GET today/{mealType}, POST update
- `service/MealService.java` - Business logic: fetch, update, verification, time windows
- `repository/MealRepository.java` - MongoDB queries by mealType + date
- `model/MealUpdate.java` - MongoDB document structure
- `dto/MealRequest.java`, `MealResponse.java` - API contracts
- `config/CorsConfig.java` - Frontend CORS whitelist

### Frontend Structure (`frontend/src/`)
- `App.js` - State management (activeMeal, selectedItems, loading)
- `components/MealTabs.js` - Tab navigation between meal types
- `components/FoodGrid.js` - Grid of FoodCard components (toggleable selection)
- `components/FoodCard.js` - Single food item with image and selection state
- `components/TodayMenuDisplay.js` - Shows current menu and verification status
- `services/api.js` - Axios wrapper with two methods
- `data/foodData.js` - FOOD_OPTIONS config, meal type helpers

## Development Commands

### Backend
```bash
cd backend
mvn spring-boot:run          # Start Spring Boot (port 8080)
mvn clean install            # Build and test
```

### Frontend
```bash
cd frontend
npm install                  # Install dependencies
npm start                    # Start React dev server (port 3000)
npm run build               # Production build
npm run deploy              # GitHub Pages deployment
```

### Database
- MongoDB must run on `localhost:27017` (or set `MONGODB_URI` env variable)
- Collections: `mealUpdate` (auto-created by Spring Data MongoDB)

## Common Tasks

### Adding a New Meal Type
1. Add entry to `MEAL_TIME_WINDOWS` in `MealService`
2. Add meal to `FOOD_OPTIONS` in `foodData.js`
3. Add case in `getMealEmoji()` and `getMealDisplayName()`
4. Validation in `MealRequest.java` if needed

### Modifying Verification Logic
- Edit `MealService.updateMeal()` method (lines ~100-130)
- Threshold at `VERIFICATION_THRESHOLD`
- Update response in `MealResponse.java` if new fields added

### UI Component Changes
- FoodCard accepts: `name`, `image`, `selected`, `onToggle` props
- FoodGrid maps `FOOD_OPTIONS[activeMeal]` to FoodCard instances
- TodayMenuDisplay uses `todayMenu` state and shows `updateWindowMessage`

### Debugging
- Backend debug logging: Check `logging.level.com.hostel.mess=DEBUG` in `application.properties`
- Frontend: React DevTools, check network tab for API calls
- MongoDB: Verify documents exist with correct date format (yyyy-MM-dd)

## Cross-Component Communication
- Frontend ↔ Backend via REST (Axios)
- No WebSockets; real-time via polling (implement in App.js if needed)
- Frontend state `todayMenu` is single source of truth for meal display
- Backend always generates fresh timestamp (`Instant.now()`) for postedAt
