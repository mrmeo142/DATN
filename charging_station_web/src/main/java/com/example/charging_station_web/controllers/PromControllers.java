package com.example.charging_station_web.controllers;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import com.example.charging_station_web.services.UserServices;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.charging_station_web.services.PromServices;
import com.example.charging_station_web.config.JwtUtil;
import com.example.charging_station_web.entities.Promotion;
import com.example.charging_station_web.entities.Users;

@RequestMapping("/promote")
@RestController
public class PromControllers {

    private final PromServices promServices;
    private final UserServices userServieces;

    public PromControllers(PromServices promServices, UserServices userServieces) {
        this.promServices = promServices;
        this.userServieces = userServieces;
    }

    // lay user qua email tu tocken (done)
    private Users getUserFromToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        String token = authHeader.substring(7);
        String email = JwtUtil.extractEmail(token);
        Users user = userServieces.getUsersbyEmail(email);
        return user;
    }

    // create promo by user (done)
    @PostMapping("/create")
    public ResponseEntity<?> createPromo(HttpServletRequest request,@RequestBody Users user) {
        try{
            Users currentUser = getUserFromToken(request);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User not found"));
            }
            if (currentUser.getRole() == 2) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "User have already registered"));
            }

            Promotion prom = new Promotion();
            String id = currentUser.getId();
            currentUser.setIdentification(user.getIdentification());
            currentUser.setAddress(user.getAddress());
            prom.setUserId(id);
            prom.setStartDate(LocalDate.now());
            prom.setStatus("Pending");
            userServieces.saveUsers(currentUser);
            Promotion p =  promServices.savePromotion(prom);
            return ResponseEntity.ok(p);
        }
        catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Registration failed"));
        } 
    }

    // update promo (for admin) (done)
    @PutMapping("/update/{promId}")
    public ResponseEntity<?> updatePromo(@PathVariable String promId, @RequestBody Promotion prom, 
                                            HttpServletRequest request) {
        try{
            Users admin = getUserFromToken(request);
            if(admin.getRole() != 1){
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Access denied: Admin only"));
            }
            Promotion update = promServices.getPromById(promId);
            Users promouser = userServieces.getUsersbyId(update.getUserId());
            promouser.setRole(2);
            promouser.setStations(new ArrayList<>());
            userServieces.saveUsers(promouser);
            // if (prom.getAdminId() != null) {
            //     update.setAdminId(prom.getAdminId());
            // }
            update.setStatus("Approved");
            update.setApprovedDate(LocalDate.now());
            Promotion p = promServices.savePromotion(update);
            return ResponseEntity.ok(p);
        }
        catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Not found registration form"));
        } 
    }

    // get a promo (for admin) (done)
    @GetMapping("/{promId}")
    public ResponseEntity<?> getPromoById(@PathVariable String promId, HttpServletRequest request) {
        try{
            Users admin = getUserFromToken(request);
            if(admin.getRole() != 2 && admin.getRole() != 1){
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Only admin or nanager"));
            }
            Promotion p = promServices.getPromById(promId);
            return ResponseEntity.ok(p);
        }
        catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Not found registration form"));
        } 
    }

    // get promotion by userId ()
    @GetMapping("/user")
    public ResponseEntity<?> getPromoByUserId(HttpServletRequest request) {
        try{
            Users admin = getUserFromToken(request);
            if(admin == null){
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "User not found"));
            }
            Promotion p = promServices.getPromByUserId(admin.getId());
            return ResponseEntity.ok(p);
        }
        catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Not found registration form"));
        } 
    }

    // get all promos (for admin) (done)
    @GetMapping("/managers")
    public ResponseEntity<?> getAllPromos(HttpServletRequest request) {
        try{
            Users admin = getUserFromToken(request);
            if(admin.getRole() != 1){
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Access denied: Admin only"));
            }
            List<Promotion> p = promServices.findAll();
            return ResponseEntity.ok(p);
        }
        catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Not found registration form"));
        }
    } 
}
