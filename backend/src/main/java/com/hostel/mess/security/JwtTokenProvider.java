package com.hostel.mess.security;

import io.jsonwebtoken.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
// ...existing code...
import java.util.Date;
// ...existing code...

@Component
public class JwtTokenProvider {

    @Value("${jwt.secret:${app.jwtSecret:${JWT_SECRET:change-me-in-production-min-32-chars-please}}}")
    private String jwtSecret;

    @Value("${jwt.expiration:${app.jwtExpirationMs:${JWT_EXPIRATION:86400000}}}") // 24 hours
    private int jwtExpirationMs;

    private byte[] key;

    @PostConstruct
    public void init() {
        if (jwtSecret == null || jwtSecret.length() < 32) {
            throw new IllegalStateException("JWT secret must be at least 32 characters. Set JWT_SECRET env var.");
        }
        this.key = jwtSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    public String generateToken(String userId, String username, String role) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);
        return Jwts.builder()
            .setSubject(userId)
            .claim("username", username)
            .claim("role", role)
            .setIssuedAt(now)
            .setExpiration(expiryDate)
            .signWith(SignatureAlgorithm.HS256, key)
            .compact();
    }

    public String getUserIdFromToken(String token) {
        Claims claims = parseClaims(token);
        return claims.getSubject();
    }

    public String getUsernameFromToken(String token) {
        Claims claims = parseClaims(token);
        return claims.get("username", String.class);
    }

    public String getRoleFromToken(String token) {
        Claims claims = parseClaims(token);
        return claims.get("role", String.class);
    }

    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        // For JJWT 0.9.1, use parser() and setSigningKey(byte[])
        return Jwts.parser()
            .setSigningKey(key)
            .parseClaimsJws(token)
            .getBody();
    }
}
