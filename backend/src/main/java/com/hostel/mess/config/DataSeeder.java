package com.hostel.mess.config;

import com.hostel.mess.model.*;
import com.hostel.mess.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private WeeklyMenuRepository weeklyMenuRepository;

    @Autowired
    private MealSubmissionRepository mealSubmissionRepository;

    @Autowired
    private MealPhotoRepository mealPhotoRepository;

    @Autowired
    private MealAttendanceRepository mealAttendanceRepository;

    @Autowired
    private FoodRatingRepository foodRatingRepository;

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private GroupMealStatusRepository groupMealStatusRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() > 0) {
            System.out.println("🌱 DataSeeder: Database already populated. Skipping auto-seed.");
            return;
        }

        System.out.println("🌱 DataSeeder: Populating MongoDB with realistic Karnataka Hostel Mess data...");

        String encodedPassword = passwordEncoder.encode("password123");
        String todayStr = LocalDate.now().toString();

        // 1. Create Admins
        User admin1 = new User("admin@msrit.edu", encodedPassword, "Admin Block", "101", "4th Year", "ADMIN");
        admin1.setRole("ADMIN");
        userRepository.save(admin1);

        User warden = new User("warden@msrit.edu", encodedPassword, "Central Mess", "W-1", "Staff", "WARDEN");
        warden.setRole("ADMIN");
        userRepository.save(warden);

        // 2. Create 100 Students
        String[] karnatakaFirstNames = {
            "Rahul", "Ananya", "Chethan", "Varun", "Priyanka", "Aditya", "Kavya", "Siddharth",
            "Meghana", "Darshan", "Divya", "Pavan", "Shreya", "Kiran", "Nisha", "Ganesh",
            "Spandana", "Yashas", "Bhumika", "Tejas", "Swathi", "Rakshith", "Monika", "Sachin"
        };
        String[] karnatakaLastNames = {
            "Gowda", "Rao", "Kumar", "Hegde", "Reddy", "Shetty", "Patil", "Naik",
            "Bhat", "Deshpande", "Kulkarni", "Prasad", "Murthy", "Shenoy", "Nayak", "Joshi"
        };

        String[] hostels = {"MSRIT Boys Block A", "MSRIT Boys Block B", "MSRIT Boys Block C", "MSRIT Girls Block D"};
        String[] branches = {"CSE", "ISE", "ECE", "EEE", "MECH", "CIVIL", "AI-DS"};
        String[] years = {"1st Year", "2nd Year", "3rd Year", "4th Year"};

        List<User> students = new ArrayList<>();

        for (int i = 1; i <= 100; i++) {
            String email = "student" + i + "@msrit.edu";
            String hostel = hostels[i % hostels.length];
            String roomNum = String.valueOf(100 + (i % 30));
            String branch = branches[i % branches.length];
            String year = years[i % years.length];

            User student = new User(email, encodedPassword, hostel, roomNum, year, branch);
            student.setPoints(15 + (i * 7) % 300);
            student.setFloor((i % 4) + 1);
            student.setPhoneNumber("+9198860" + String.format("%05d", (i * 123) % 100000));
            student.setFavoriteFoods(Arrays.asList("Masala Dosa", "Bisibele Bath", "Paneer Butter Masala", "Gulab Jamun"));

            if (student.getPoints() > 150) {
                student.setBadges(Arrays.asList("Top Reporter", "Mess Verified", "Consensus Hero"));
            } else if (student.getPoints() > 80) {
                student.setBadges(Arrays.asList("Active Reporter", "Mess Foodie"));
            } else {
                student.setBadges(Arrays.asList("Hostel Member"));
            }

            students.add(userRepository.save(student));
        }

        System.out.println("✅ Created 100 Students and 2 Admins.");

        // 3. Create Rooms
        for (int r = 101; r <= 130; r++) {
            for (String h : hostels) {
                Room room = new Room();
                room.setBlock(h);
                room.setRoomNumber(String.valueOf(r));
                room.setFloor(1 + (r % 4));
                room.setCapacity(2);
                room.setOccupancy(2);
                room.setStatus("OCCUPIED");
                roomRepository.save(room);
            }
        }

        // 4. Create Weekly Menu
        WeeklyMenu weeklyMenu = new WeeklyMenu();
        weeklyMenu.setWeekStartDate(todayStr);

        weeklyMenu.setMonday(Map.of(
            "BREAKFAST", List.of("Idli", "Sambar", "Coconut Chutney", "Tea"),
            "LUNCH", List.of("Steamed Rice", "Sambar", "Rasam", "Beans Palya", "Curd"),
            "SNACKS", List.of("Onion Pakoda", "Tea"),
            "DINNER", List.of("Chapati", "Dal Tadka", "Steamed Rice", "Rasam")
        ));
        weeklyMenu.setTuesday(Map.of(
            "BREAKFAST", List.of("Masala Dosa", "Potato Palya", "Coconut Chutney", "Coffee"),
            "LUNCH", List.of("Steamed Rice", "Majjige Huli", "Cabbage Palya", "Rasam", "Curd"),
            "SNACKS", List.of("Mangalore Bonda", "Tea"),
            "DINNER", List.of("Chapati", "Veg Kurma", "Steamed Rice", "Rasam")
        ));
        weeklyMenu.setWednesday(Map.of(
            "BREAKFAST", List.of("Khara Bath", "Kesari Bath", "Coffee"),
            "LUNCH", List.of("Vegetable Pulao", "Sambar", "Rasam", "Curd"),
            "SNACKS", List.of("Samosa", "Coffee"),
            "DINNER", List.of("Chapati", "Paneer Butter Masala", "Steamed Rice", "Rasam")
        ));
        weeklyMenu.setThursday(Map.of(
            "BREAKFAST", List.of("Poori", "Vegetable Sagu", "Tea"),
            "LUNCH", List.of("Bisibele Bath", "Curd Rice", "Papad", "Pickle"),
            "SNACKS", List.of("Chilli Bajji", "Tea"),
            "DINNER", List.of("Chapati", "Aloo Gobi", "Steamed Rice", "Rasam")
        ));
        weeklyMenu.setFriday(Map.of(
            "BREAKFAST", List.of("Rava Idli", "Vegetable Sagu", "Coconut Chutney", "Tea"),
            "LUNCH", List.of("Lemon Rice", "Sambar", "Beetroot Palya", "Rasam", "Curd"),
            "SNACKS", List.of("Veg Puff", "Tea"),
            "DINNER", List.of("Chapati", "Dal Fry", "Steamed Rice", "Rasam", "Gulab Jamun")
        ));
        weeklyMenu.setSaturday(Map.of(
            "BREAKFAST", List.of("Avalakki", "Groundnut Chutney", "Tea"),
            "LUNCH", List.of("Tomato Bath", "Majjige Huli", "Potato Fry", "Curd"),
            "SNACKS", List.of("Cutlet", "Coffee"),
            "DINNER", List.of("Chapati", "Mixed Vegetable Curry", "Steamed Rice", "Rasam")
        ));
        weeklyMenu.setSunday(Map.of(
            "BREAKFAST", List.of("Set Dosa", "Vegetable Kurma", "Coffee"),
            "LUNCH", List.of("Jeera Rice", "Dal Tadka", "Paneer Butter Masala", "Mysore Pak"),
            "SNACKS", List.of("Sweet Corn", "Tea"),
            "DINNER", List.of("Chapati", "Palak Paneer", "Steamed Rice", "Rasam", "Ice Cream")
        ));

        weeklyMenuRepository.save(weeklyMenu);
        System.out.println("✅ Populated Weekly Menu.");

        // 5. Create Meal Submissions & Photo Reports for Today
        String[] slots = {"BREAKFAST", "LUNCH", "SNACKS", "DINNER"};
        Map<String, List<String>> slotFoodItems = Map.of(
            "BREAKFAST", List.of("Thatte Idli", "Sambar", "Coconut Chutney", "Tea"),
            "LUNCH", List.of("Steamed Rice", "Sambar", "Rasam", "Beans Palya", "Curd"),
            "SNACKS", List.of("Mangalore Bonda", "Coffee"),
            "DINNER", List.of("Chapati", "Paneer Butter Masala", "Steamed Rice", "Rasam")
        );

        for (String slot : slots) {
            List<String> items = slotFoodItems.get(slot);
            for (int s = 0; s < 12; s++) {
                User reporter = students.get((s * 7) % students.size());
                MealSubmission sub = new MealSubmission(
                    reporter.getId(),
                    reporter.getEmail(),
                    slot,
                    todayStr,
                    items,
                    "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop"
                );
                mealSubmissionRepository.save(sub);

                // Save Photo
                MealPhoto photo = new MealPhoto();
                photo.setMealType(slot);
                photo.setDate(todayStr);
                photo.setImageUrls(List.of("https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop"));
                photo.setDescription("Freshly served " + items.get(0) + " at counter (Reported by " + reporter.getEmail() + ")");
                photo.setUploadedAt(new Date());
                mealPhotoRepository.save(photo);
            }
        }

        System.out.println("✅ Generated Meal Submissions and Live Consensus Data.");

        // 6. Create Meal Attendance
        for (int i = 0; i < 40; i++) {
            User st = students.get(i);
            MealAttendance att = new MealAttendance(st.getEmail(), "LUNCH", todayStr, i % 5 != 0);
            att.setPresent(i % 3 != 0);
            att.setCheckedInAt(Instant.now());
            mealAttendanceRepository.save(att);
        }

        // 7. Create Food Ratings & Complaints
        for (int r = 0; r < 20; r++) {
            User st = students.get(r);
            FoodRating rating = new FoodRating();
            rating.setUserId(st.getId());
            rating.setUserEmail(st.getEmail());
            rating.setMealType("LUNCH");
            rating.setDate(todayStr);
            rating.setRatingOverall(4);
            rating.setTaste(4);
            rating.setQuality(4);
            rating.setQuantity(5);
            rating.setTemperature(4);
            rating.setCleanliness(5);
            rating.setPresentation(4);
            rating.setReviewText("Good quality food served today.");
            foodRatingRepository.save(rating);
        }

        Complaint comp1 = new Complaint("BREAKFAST", "Coconut Chutney", todayStr);
        comp1.setReasons(List.of("Quantity low"));
        comp1.setComments(List.of("Coconut Chutney counter ran out early at 8:45 AM."));
        comp1.setStatus("RESOLVED");
        complaintRepository.save(comp1);

        // 8. Create Buddy Group
        Group group1 = new Group("MSRIT CSE 5th Sem Squad", "MSRIT-CSE-5", List.of(students.get(0).getEmail(), students.get(1).getEmail(), students.get(2).getEmail()), students.get(0).getEmail());
        Group savedGroup = groupRepository.save(group1);

        GroupMealStatus gStatus = new GroupMealStatus(savedGroup.getId(), "LUNCH", List.of(students.get(0).getEmail(), students.get(1).getEmail()));
        groupMealStatusRepository.save(gStatus);

        // 9. Notifications
        Notification notif = new Notification();
        notif.setRecipientEmail(students.get(0).getEmail());
        notif.setTitle("Points Earned!");
        notif.setMessage("You earned +25 points for reporting today's Lunch serving.");
        notif.setType("REWARD");
        notificationRepository.save(notif);

        System.out.println("🎉 DataSeeder: MongoDB initialized successfully with 100 students, admin accounts, and Karnataka hostel mess data!");
    }
}
