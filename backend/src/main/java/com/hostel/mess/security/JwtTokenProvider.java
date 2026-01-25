package com.hostel.mess.security;

/**
 * JWT Token Provider - Disabled
 * Authentication is disabled so this provider is not used
 */
public class JwtTokenProvider {
    
    public String generateToken(String userId, String email) {
        throw new RuntimeException("JWT token generation is disabled");
    }
    
    public String getUserIdFromToken(String token) {
        throw new RuntimeException("JWT token validation is disabled");
    }
    
    public String getEmailFromToken(String token) {
        throw new RuntimeException("JWT token validation is disabled");
    }
    
    public boolean validateToken(String token) {
        return false;
    }
}
