package com.example.charging_station_web.controllers;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.charging_station_web.config.JwtUtil;
import com.example.charging_station_web.entities.Price;
import com.example.charging_station_web.entities.Users;
import com.example.charging_station_web.services.PriceServices;
import com.example.charging_station_web.services.UserServices;

import jakarta.servlet.http.HttpServletRequest;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PutMapping;

@RequestMapping("/price")
@RestController
public class PriceControllers {

    private final PriceServices priceServices;
    private final UserServices userServices;
    
    public PriceControllers(PriceServices priceServices, UserServices userServices) {
        this.priceServices = priceServices;
        this.userServices = userServices;
    }

    // lay user qua email tu tocken (done)
    private Users getUserFromToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        String token = authHeader.substring(7);
        String email = JwtUtil.extractEmail(token);
        Users user = userServices.getUsersbyEmail(email);
        return user;
    }
    
    // create price (for admin) (done)
    @PostMapping("/create")
    public ResponseEntity<?> createPrice(@RequestBody Price price, HttpServletRequest request) {
        try{
            Users currentUser = getUserFromToken(request);
            if (currentUser.getRole() != 1) { // Chỉ admin
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Access denied: Admin only"));
            }
            Price p = priceServices.savePrice(price);
            return ResponseEntity.ok(p);
        }
        catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", e.getMessage()));
        } 
    }
    
    // get price (done)
    @GetMapping("/get")
    public Price getPrice(HttpServletRequest request) {
        return priceServices.getPrice();
    }

    // update price (for admin) (done)
    @PutMapping("/update")
    public ResponseEntity<?> updatePrice(@RequestBody Price price, HttpServletRequest request) {
        try{
            Users currentUser = getUserFromToken(request);
            if (currentUser.getRole() != 1) { // Chỉ admin
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Access denied: Admin only"));
            }
            Price newPrice = priceServices.getPrice();
            Double value = price.getPrice();
            newPrice.setPrice(value);
            Price p = priceServices.savePrice(newPrice);
            return ResponseEntity.ok(p);
        }
        catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", e.getMessage()));
        } 
    }
}
