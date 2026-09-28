package com.hostel.mess.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

import com.hostel.mess.security.CustomUserDetailsService;
import com.hostel.mess.security.JwtAuthenticationFilter;
import com.hostel.mess.security.JwtService;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter(JwtService jwtService, CustomUserDetailsService customUserDetailsService) {
        return new JwtAuthenticationFilter(jwtService, customUserDetailsService);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthenticationFilter jwtAuthFilter) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**", "/", "/index.html", "/static/**", "/public/**", "/ws/**", "/health", "/actuator/health").permitAll()
                .requestMatchers(HttpMethod.GET, "/uploads/**", "/api/student-photos/*/image", "/api/student-photos/**/image").permitAll()
                .requestMatchers("/api/groups/**").authenticated()
                .requestMatchers("/api/group-meal-status/**").authenticated()
                .requestMatchers("/api/complaints/**").authenticated()
                .requestMatchers("/api/users/**").authenticated()
                .requestMatchers("/api/chat/**").authenticated()
                .requestMatchers("/api/notifications/**").authenticated()
                .requestMatchers("/api/ratings/**").authenticated()
                .requestMatchers("/api/analytics/**").authenticated()
                .requestMatchers("/api/attendance/**").authenticated()
                .requestMatchers("/api/announcements/**").authenticated()
                .requestMatchers("/api/weekly-menu/**").authenticated()
                .requestMatchers("/api/meals/**").authenticated()
                .requestMatchers("/api/student-photos/**").authenticated()
                .requestMatchers("/api/search").authenticated()
                .requestMatchers("/api/favorites/**").authenticated()
                .requestMatchers("/api/admin/**").authenticated()
                .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
