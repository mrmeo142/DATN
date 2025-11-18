package com.example.charging_station_web.controllers;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.charging_station_web.config.JwtUtil;
import com.example.charging_station_web.entities.Chargers;
import com.example.charging_station_web.entities.Users;
import com.example.charging_station_web.services.ChargerServices;
import com.example.charging_station_web.services.UserServices;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;


@RestController
@RequestMapping("/charger") 
public class ChargerControllers {

    private final ChargerServices chargerServices;
    private final UserServices userServices;

    public ChargerControllers(ChargerServices chargerServices, UserServices userServices) {
        this.chargerServices = chargerServices;
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

    // create charger (for admin) (done)
    @PostMapping("/create")
    public ResponseEntity<?> createCharger(@RequestParam Integer numbers, HttpServletRequest request) {
        try{
            Users currentUser = getUserFromToken(request);
            if (currentUser.getRole() != 1) { // Chỉ admin
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Access denied: Admin only"));
            }
            for(int i =0 ; i < numbers; i++){
                Chargers charger = new Chargers();
                charger.setProcess("unprocessed");
                charger.setStatus("INACTIVE");
                chargerServices.saveCharger(charger);
            }
            return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(Map.of("message", "Added charging station successfully"));
        }
        catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", " Add failed"));
        } 
    }

    // get charger by id (for admin/manager) (done)
    @GetMapping("/{chargerId}")
    public ResponseEntity<?> getChargerById(@PathVariable String chargerId, HttpServletRequest request) {
        try{
            Users currentUser = getUserFromToken(request);
            if (currentUser.getRole() != 1 && currentUser.getRole() != 2) { 
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Access denied: Admin or Manager"));
            }
            Chargers ch =  chargerServices.findChargerById(chargerId);
            return ResponseEntity.ok(ch);
        }
        catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Charger not found"));
        } 
    }

    // delete charger by id (for admin) (done)
    @DeleteMapping("/delete/{chargerId}")
    public ResponseEntity<?> deleteChargerById(@PathVariable String chargerId, HttpServletRequest request) {
        try{
            Users currentUser = getUserFromToken(request);
            if (currentUser.getRole() != 1 ) { 
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Access denied: Admin only"));
            }
            chargerServices.deleteChargerById(chargerId);
            return ResponseEntity.status(HttpStatus.ACCEPTED)
                    .body(Map.of("message", "Deleted successfully"));
        }
        catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        } 
    }

    // get all chargers (for user/admin) (done)
    @GetMapping("/manager/{mngId}")
    public ResponseEntity<?> getAllChargersByMngId(@PathVariable String mngId, HttpServletRequest request) {
        try{
            Users currentUser = getUserFromToken(request);
            if (currentUser.getRole() != 0 && currentUser.getRole() != 1) { 
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Access denied: User or Admin"));
            }
            List<Chargers> ch = chargerServices.findAllByMngId(mngId);
            return ResponseEntity.ok(ch);
        }
        catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", e.getMessage()));
        } 
    }

    // get all chargers (for manager) (done)
    @GetMapping("/manager")
    public ResponseEntity<?> getAllChargersByMng(HttpServletRequest request) {
         try{
            Users currentUser = getUserFromToken(request);
            if (currentUser.getRole() != 2 ) { 
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Access denied: Manager only"));
            }
            List<Chargers> ch = chargerServices.findAllByMngId(currentUser.getId());
            return ResponseEntity.ok(ch);
        }
        catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", e.getMessage()));
        } 
    }
    // get all chargers (for admin) (done)
    @GetMapping("/all")
    public ResponseEntity<?> getAllChargers(HttpServletRequest request) {
        try{
            Users currentUser = getUserFromToken(request);
            if (currentUser.getRole() != 1 ) { 
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Access denied: Admin only"));
            }
            List<Chargers> ch = chargerServices.findAll();
            return ResponseEntity.ok(ch);
        }
        catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "User not found"));
        } 
    }

    // update charger (for admin/manager) (done)
    @PutMapping("/update/{chargerId}")
    public ResponseEntity<?> updateCharger(@PathVariable String chargerId, HttpServletRequest request) {
        try{
            Users currentUser = getUserFromToken(request);
            if (currentUser.getRole() != 1 &&  currentUser.getRole() != 2) { 
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Access denied: Admin or Manager"));
            }
            Chargers update = chargerServices.findChargerById(chargerId);
            update.setProcess("maintenance");
            Chargers ch = chargerServices.saveCharger(update);
            return ResponseEntity.ok(ch);
        }
        catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Update failed"));
        } 
    }

    // add chargers for manager (for admin) (done)
    @PutMapping("manager/{userId}")
    public ResponseEntity<?> addChargers(@PathVariable String userId, @RequestParam Integer number, HttpServletRequest request){
        try{
            Users currentUser = getUserFromToken(request);
            if (currentUser.getRole() != 1) { // Chỉ admin
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Access denied: Admin only"));
            }
            Users us = chargerServices.addChargers(userId, number);
            return ResponseEntity.ok(us);
        }
        catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        } 
    }
}
