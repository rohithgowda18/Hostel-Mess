package com.hostel.mess;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.hostel.mess.model.User;
import com.hostel.mess.repository.UserRepository;
import com.hostel.mess.security.JwtService;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("1. Application context loads and public health endpoint works without authentication")
    public void testPublicEndpoint() throws Exception {
        mockMvc.perform(get("/health"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("1b. Public login endpoint is accessible without authentication")
    public void testPublicLoginEndpointAccessible() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"nonexistent@test.com\",\"password\":\"password\"}"))
                .andExpect(status().isUnauthorized()); // 401 from auth service, NOT 403 from security filter
    }

    @Test
    @DisplayName("2. Authenticated student can access student attendance endpoints")
    public void testStudentEndpoint() throws Exception {
        // Create or find a test student user in repository
        User student = userRepository.findByEmail("test_sec_student@example.com").orElseGet(() -> {
            User u = new User();
            u.setEmail("test_sec_student@example.com");
            u.setPassword("$2a$10$dummyHashNotUsedForJwtAuth123456789012345");
            u.setRole("STUDENT");
            return userRepository.save(u);
        });

        String studentToken = jwtService.generateToken(student.getId(), student.getEmail(), "STUDENT");

        mockMvc.perform(get("/api/attendance/my-status")
                        .param("mealType", "LUNCH")
                        .param("date", "2026-09-29")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("3. Student cannot access ADMIN endpoints (403 Forbidden)")
    public void testStudentCannotAccessAdmin() throws Exception {
        User student = userRepository.findByEmail("test_sec_student@example.com").orElseGet(() -> {
            User u = new User();
            u.setEmail("test_sec_student@example.com");
            u.setPassword("$2a$10$dummyHashNotUsedForJwtAuth123456789012345");
            u.setRole("STUDENT");
            return userRepository.save(u);
        });

        String studentToken = jwtService.generateToken(student.getId(), student.getEmail(), "STUDENT");

        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("4. ADMIN can access ADMIN endpoints")
    public void testAdminCanAccessAdmin() throws Exception {
        User admin = userRepository.findByEmail("test_sec_admin@example.com").orElseGet(() -> {
            User u = new User();
            u.setEmail("test_sec_admin@example.com");
            u.setPassword("$2a$10$dummyHashNotUsedForJwtAuth123456789012345");
            u.setRole("ADMIN");
            return userRepository.save(u);
        });

        String adminToken = jwtService.generateToken(admin.getId(), admin.getEmail(), "ADMIN");

        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }
}
