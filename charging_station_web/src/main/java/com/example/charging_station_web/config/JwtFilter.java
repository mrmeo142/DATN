package com.example.charging_station_web.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.filter.OncePerRequestFilter;

import com.example.charging_station_web.repositories.TokenBlacklist;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.util.Collections;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private TokenBlacklist blacklistRepository;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        final String requestURI = request.getRequestURI();

        if (requestURI.startsWith("/ws/") ||
                requestURI.equals("/login") ||
                requestURI.startsWith("/public/")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7).trim();

        if (token.isEmpty()
                || token.length() < 20
                || !token.contains(".")
                || "null".equalsIgnoreCase(token)
                || "undefined".equalsIgnoreCase(token)) {
            filterChain.doFilter(request, response);
            return;
        }
        try {
            // Kiểm tra blacklist trước (tránh parse token đã bị thu hồi)
            if (!requestURI.equals("/logout") && blacklistRepository.existsByToken(token)) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("{\"message\": \"Token đã bị thu hồi\"}");
                return;
            }

            String email = JwtUtil.extractEmail(token);

            if (email != null && JwtUtil.validateToken(token, email)) {
                UserDetails userDetails = User.withUsername(email)
                        .password("")
                        .authorities(Collections.emptyList())
                        .build();

                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(userDetails,
                        null, userDetails.getAuthorities());

                SecurityContextHolder.getContext().setAuthentication(authToken);
            } else {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("{\"message\": \"Token không hợp lệ\"}");
                return;
            }

        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            response.setStatus(401);
            response.getWriter().write("{\"message\": \"Token đã hết hạn\"}");
            return;
        } catch (io.jsonwebtoken.MalformedJwtException | IllegalArgumentException e) {
        }

        filterChain.doFilter(request, response);
    }
}
