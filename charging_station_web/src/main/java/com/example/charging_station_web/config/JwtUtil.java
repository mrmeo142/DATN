package com.example.charging_station_web.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;

import java.security.Key;
import java.util.Date;

public class JwtUtil {

    private static final String SECRET_KEY = "mySuperSecretKeyForJWTsMustBeLongEnough123!"; // ít nhất 256 bit
    private static final Key KEY = Keys.hmacShaKeyFor(SECRET_KEY.getBytes());

    // Tạo token
    public static String generateToken(String email) {
        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 1000L * 60 * 60 * 24 * 30)) // 30 ngày
                .signWith(KEY, SignatureAlgorithm.HS256)
                .compact();
    }

    // Lấy useremail từ token
    public static String extractEmail(String token) {
        return getClaims(token).getSubject();
    }

    // Kiểm tra token còn hiệu lực không
    public static boolean validateToken(String token, String email) {
        return extractEmail(token).equals(email) && !isTokenExpired(token);
    }

    private static Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(KEY)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private static boolean isTokenExpired(String token) {
        return getClaims(token).getExpiration().before(new Date());
    }

    // Lấy thời gian hết hạn của token
    public static Date getExpiration(String token) {
        return getClaims(token).getExpiration();
    }

}
