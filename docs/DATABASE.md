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

### 4. **Meal Submissions Collection** (`meal_submissions`)
Stores student consensus reports for live meal reporting.
- **Java Class**: `com.hostel.mess.model.MealSubmission`
- **Fields**:
  - `_id` (`ObjectId`): Document identifier.
  - `studentId` (`String`): MongoDB user identifier of the reporting student.
  - `studentEmail` (`String`): Email of the reporting student.
  - `mealType` (`String`): Category of the meal.
  - `date` (`String`): Local date formatted as `YYYY-MM-DD`.
  - `selectedItems` (`List<String>`): Food items the student reports were served.
  - `photoUrl` (`String`): Optional photo evidence URL.
  - `submittedAt` (`Instant`): Timestamp of the submission.
- **Example Document**:
  ```json
  {
    "_id": {"$oid": "65b267ad108fe7123456789d"},
    "studentId": "65b267ad108fe7123456789a",
    "studentEmail": "student1@hostel.app",
    "mealType": "LUNCH",
    "date": "2026-07-14",
    "selectedItems": ["Rice", "Sambar", "Chapati", "Vegetable Curry", "Curd"],
    "photoUrl": "/uploads/student-photos/abc.jpg",
    "submittedAt": {"$date": "2026-07-14T12:30:00Z"}
  }
  ```

### 5. **Weekly Menu Collection** (`weekly_menus`)
Stores the official weekly meal schedule published by admins.
- **Java Class**: `com.hostel.mess.model.WeeklyMenu`
- **Fields**:
  - `_id` (`ObjectId`): Document identifier.
  - `weekStartDate` (`String`): Monday of the week in `YYYY-MM-DD` format (unique index).
  - `monday` / `tuesday` / `wednesday` / `thursday` / `friday` / `saturday` / `sunday` (`Map<String, List<String>>`): Maps each meal type (`BREAKFAST`, `LUNCH`, `SNACKS`, `DINNER`) to its list of food items for that day.

---

## 🔍 Database Query Indexes

### 1. Unique Indexes
- **`users.email`**: Ensures unique emails during signup.
- **`groups.groupCode`**: Ensures group codes do not conflict.

### 2. Compound Indexes
- **`chat_messages` (`chatType`, `chatId`)**: Optimizes message lookups for groups and the universal chat.
- **`food_ratings` (`userEmail`, `mealType`, `date`)**: Unique compound index — ensures one rating per user per meal per day.
- **`meal_attendance` (`userEmail`, `mealType`, `date`)**: Unique compound index — ensures one attendance record per user per meal per day.
- **`rooms` (`block`, `roomNumber`)**: Unique compound index — prevents duplicate room numbers within a block.
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
