# ⚙️ Backend Subsystem Documentation (Deep Dive)

The backend is built as a modular Spring Boot 3.2 application. It handles user authentication, websocket communication, database entity mapping, file uploads, and background cleanups.

---

## 🏗️ Maven Configuration (`pom.xml`)

Key dependencies declared in `pom.xml`:
- `spring-boot-starter-web`: Supports RESTful controllers.
- `spring-boot-starter-data-mongodb`: Provides Spring Data Repository support for MongoDB.
- `spring-boot-starter-security`: Secures endpoints.
- `spring-boot-starter-websocket`: Supports real-time client notifications.
- `jjwt` (version `0.9.1`): JWT creation and token validation.

---

## 📂 Source Code & Package Structure

The package directory `com.hostel.mess` is structured as follows:

```
com.hostel.mess/
├── config/
│   ├── CleanupScheduler.java       # Scheduled background cleanups
│   ├── CorsConfig.java             # Global CORS security filters
│   ├── SecurityConfig.java         # Spring Security chain configurations
│   ├── StaticResourceConfig.java   # Serves student uploads from disk
│   └── WebSocketConfig.java        # WebSocket broker registrations
├── controller/
│   ├── AdminController.java            # Admin stats, occupancy metrics & user management
│   ├── AnnouncementController.java     # System announcements API
│   ├── AttendanceController.java       # Expected attendance declaration & QR check-ins
│   ├── AuthController.java             # Registration, authentication & JWT token generation
│   ├── ChatController.java             # HTTP message history logs
│   ├── ChatWebSocketController.java    # WebSocket real-time messaging STOMP handlers
│   ├── ComplaintController.java        # Community complaints & voting
│   ├── DirectoryController.java        # Hostel room directory tree & search
│   ├── FavoritesController.java        # User favorite food preferences
│   ├── GroupController.java            # Buddy group creation, joining & management
│   ├── GroupMealStatusController.java     # Buddy group meal participation tracker
│   ├── MealController.java             # Daily meal menus coordinator
│   ├── RatingController.java           # Meal dish ratings & reviews
│   ├── SearchController.java           # Universal global search across entities
│   ├── StudentFoodPhotoController.java # Community food photo uploads & feed
│   └── WeeklyMenuController.java       # Weekly meal schedule matrix
├── dto/                                # Data Transfer Objects (RegisterRequest, LoginRequest, etc.)
├── model/                              # MongoDB entity documents
├── repository/                         # Spring Data MongoDB Repository interfaces
├── security/                           # JWT filters, UserDetailsService & token providers
└── service/                            # Core business logic services
```

---

## 🚦 REST Controller Methods & Logic

All REST controllers return JSON structures using standard Spring annotations.

### 1. **Auth Controller** (`AuthController.java`)
- **`POST /api/auth/register`**
  - Parameter: `@RequestBody RegisterRequest request` (`email`, `password`, `hostel`, `roomNumber`, `year`, `branch`)
  - Logic: Validates email and password presence, checks uniqueness against `UserRepository`, hashes password using `PasswordEncoder`, sets `ROLE` (`ADMIN` for privileged email address, else `STUDENT`), and returns `LoginResponse` with generated JWT token and `UserInfo`.
- **`POST /api/auth/login`**
  - Parameter: `@RequestBody LoginRequest request` (`email`, `password`)
  - Logic: Fetches user by email, verifies BCrypt hashed password, refreshes admin status if email matches configured admin, returns token and `UserInfo`.

### 1. **Group Controller** (`GroupController.java`)
- **`POST /api/groups/create`**
  - Parameter: `@AuthenticationPrincipal UserDetails userDetails`, `@RequestBody Map<String, String> payload`
  - Logic: Extracts user ID from principal. Generates unique 8-character code, adds creator's email, and saves group.
- **`POST /api/groups/join`**
  - Parameter: `@AuthenticationPrincipal UserDetails userDetails`, `@RequestBody Map<String, String> payload`
  - Logic: Fetches user by ID. Looks up group by `groupCode`. Checks membership, appends user email, and saves group.
- **`DELETE /api/groups/{groupId}/leave`**
  - Parameter: `@AuthenticationPrincipal UserDetails userDetails`, `@PathVariable String groupId`
  - Logic: Removes user from group list. If group is empty, deletes it from repository. If creator left, assigns next member.

### 2. **Group Meal Status Controller** (`GroupMealStatusController.java`)
- **`POST /api/group-meal-status/going`**
  - Parameter: `@RequestBody Map<String, String> payload` (contains `groupId`, `mealType`)
  - Logic: Inserts user email into the `goingUsers` list for that group/meal. Resets expiry timer to +30 minutes.
- **`DELETE /api/group-meal-status/{groupId}/{mealType}`**
  - Parameter: `@PathVariable String groupId`, `@PathVariable String mealType`
  - Logic: Removes user email from the `goingUsers` list.

### 3. **Student Food Photo Controller** (`StudentFoodPhotoController.java`)
- **`POST /api/student-photos/upload`**
  - Parameter: `@RequestParam("images") List<MultipartFile> images`, `@RequestParam(value="description", required=false) String desc`
  - Logic: Writes uploaded files to local disk under `uploads/student-photos/` with a UUID prefix to prevent filename conflicts. Detects current meal category based on Indian Standard Time (IST) timezone. Saves metadata (paths, timestamp) in database.

---

## ⚙️ Background Services & Logic

### 1. **Authentication Services** (`AuthService.java`)
- Generates JWT tokens upon successful login using `JwtTokenProvider`.
- Resolves roles (assigns `ADMIN` to pre-configured addresses, otherwise default to `STUDENT`).

### 2. **Cleanup Scheduler** (`CleanupScheduler.java`)
Runs background cleanups to keep the database tidy.
```java
@Component
public class CleanupScheduler {

    @Autowired
    private ChatRepository chatRepository;

    @Autowired
    private GroupMealStatusRepository groupMealStatusRepository;

    // Runs every 5 minutes to clean up expired group meal status entries
    @Scheduled(fixedRate = 5 * 60 * 1000)
    public void cleanupExpiredGroupMealStatuses() {
        Instant now = Instant.now();
        List<GroupMealStatus> expiredStatuses = groupMealStatusRepository.findByExpiresAtBefore(now);
        if (!expiredStatuses.isEmpty()) {
            groupMealStatusRepository.deleteAll(expiredStatuses);
            System.out.println("[CLEANUP] Deleted " + expiredStatuses.size() + " expired group meal statuses");
        }
    }
}
```

---

## 🛡️ Exception Handling

Controllers implement local `try-catch` wrappers returning descriptive status codes:
- **`HttpStatus.UNAUTHORIZED` (`401`)**: Missing or invalid JWT credentials.
- **`HttpStatus.BAD_REQUEST` (`400`)**: Validation errors, duplicate joins, or invalid formats.
- **`HttpStatus.NOT_FOUND` (`404`)**: Group or resource does not exist.
- **`HttpStatus.INTERNAL_SERVER_ERROR` (`500`)**: File write exceptions or database connection failures.
