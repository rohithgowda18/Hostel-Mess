# 🗄️ Database Architecture & Schemas (Deep Dive)

The application uses **MongoDB** as its primary document datastore. Documents are mapped to Java entities using Spring Data MongoDB annotations. This document details the exact entity layouts, indexing patterns, repository queries, and provides JSON document examples.

---

## 🗂️ MongoDB Schema Specifications

### 1. **User Collection** (`users`)
Stores student and administrator profile data.
- **Java Class**: `com.hostel.mess.model.User`
- **Fields**:
  - `_id` (`ObjectId`): Unique document identifier.
  - `email` (`String`): Email address used for authentication.
  - `password` (`String`): BCrypt password hash.
  - `role` (`String`): Access role (`STUDENT` or `ADMIN`).
  - `hostel` (`String`): Optional hostel building identifier.
  - `roomNumber` (`String`): Optional room number.
  - `year` (`String`): Optional year of study.
  - `branch` (`String`): Optional academic branch.
- **Example Document**:
  ```json
  {
    "_id": {"$oid": "65b267ad108fe7123456789a"},
    "email": "student@hostel.app",
    "password": "$2a$10$X87s29Kshq9wAjs8wKs92heHskqwia092kd81hskqwiaJshqwi782",
    "role": "STUDENT",
    "hostel": "Narmada Block",
    "roomNumber": "B-304",
    "year": "3rd Year",
    "branch": "Computer Science"
  }
  ```

### 2. **Groups Collection** (`groups`)
Stores buddy groups for meal coordination.
- **Java Class**: `com.hostel.mess.model.Group`
- **Fields**:
  - `_id` (`ObjectId`): Group document identifier.
  - `name` (`String`): Custom group name.
  - `groupCode` (`String`): Generated 8-character unique alphanumeric sharing code.
  - `members` (`List<String>`): List of member email addresses.
  - `creator` (`String`): Email address of the group creator.
  - `createdAt` (`Instant`): Timestamp of creation.
- **Example Document**:
  ```json
  {
    "_id": {"$oid": "65b267ad108fe7123456789b"},
    "name": "CSE Breakfast Club",
    "groupCode": "XJ89KL2A",
    "members": [
      "student1@hostel.app",
      "student2@hostel.app",
      "student3@hostel.app"
    ],
    "creator": "student1@hostel.app",
    "createdAt": {"$date": "2026-07-14T09:00:00Z"}
  }
  ```

### 3. **Group Meal Status Collection** (`group_meal_status`)
Tracks temporary meal-going coordination. Contains an auto-expiring index.
- **Java Class**: `com.hostel.mess.model.GroupMealStatus`
- **Fields**:
  - `_id` (`ObjectId`): Meal status identifier.
  - `groupId` (`String`): Reference to the group.
  - `mealType` (`String`): Target meal category (`BREAKFAST`, `LUNCH`, `SNACKS`, `DINNER`).
  - `goingUsers` (`List<String>`): Email addresses of students going to this meal.
  - `updatedAt` (`Instant`): Timestamp of the last status change.
  - `expiresAt` (`Instant`): Auto-calculated expiry timestamp (set to 30 minutes after `updatedAt`).
- **Example Document**:
  ```json
  {
    "_id": {"$oid": "65b267ad108fe7123456789c"},
    "groupId": "65b267ad108fe7123456789b",
    "mealType": "BREAKFAST",
    "goingUsers": [
      "student1@hostel.app",
      "student2@hostel.app"
    ],
    "updatedAt": {"$date": "2026-07-14T14:00:00Z"},
    "expiresAt": {"$date": "2026-07-14T14:30:00Z"}
  }
  ```

### 4. **Meals Collection** (`meals`)
Stores daily menus posted for each meal category.
- **Java Class**: `com.hostel.mess.model.MealUpdate`
- **Fields**:
  - `_id` (`ObjectId`): Document identifier.
  - `mealType` (`String`): Category of the meal.
  - `date` (`String`): Local date formatted as `YYYY-MM-DD`.
  - `items` (`List<String>`): Food items in the menu.
  - `status` (`String`): Menu status (`UNVERIFIED`, `VERIFIED`, `UNCERTAIN`).
  - `updatedBy` (`String`): MongoDB user identifier of the poster.
  - `updatedAt` (`Instant`): Timestamp of the update.
- **Example Document**:
  ```json
  {
    "_id": {"$oid": "65b267ad108fe7123456789d"},
    "mealType": "LUNCH",
    "date": "2026-07-14",
    "items": ["Rice", "Sambar", "Chapati", "Vegetable Curry", "Curd"],
    "status": "VERIFIED",
    "updatedBy": "65b267ad108fe7123456789a",
    "updatedAt": {"$date": "2026-07-14T12:30:00Z"}
  }
  ```

---

## 🔍 Database Query Indexes

### 1. Unique Indexes
- **`users.email`**: Ensures unique emails during signup.
- **`groups.groupCode`**: Ensures group codes do not conflict.

### 2. Compound Indexes
- **`meals` (`mealType`, `date`)**: Unique compound index. Optimizes queries fetching menus for a specific day.
- **`group_meal_status` (`groupId`, `mealType`)**: Optimizes lookups for a group's meal status.

---

## 📡 Repository Methods

Repository interfaces extend `MongoRepository` to expose clean query helper methods.

### 1. **UserRepository** (`UserRepository.java`)
- `Optional<User> findByEmail(String email)`
- `boolean existsByEmail(String email)`

### 2. **GroupRepository** (`GroupRepository.java`)
- `Optional<Group> findByGroupCode(String groupCode)`
- `List<Group> findByMembersContaining(String email)`: Finds all groups that a student's email belongs to.

### 3. **GroupMealStatusRepository** (`GroupMealStatusRepository.java`)
- `Optional<GroupMealStatus> findByGroupIdAndMealType(String groupId, String mealType)`
- `List<GroupMealStatus> findByExpiresAtBefore(Instant time)`: Used by the background scheduler to clean up expired meal statuses.
