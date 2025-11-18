package com.example.charging_station_web.controllers;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.charging_station_web.config.JwtUtil;
import com.example.charging_station_web.entities.Banks;
import com.example.charging_station_web.entities.Users;
import com.example.charging_station_web.services.BankServices;
import com.example.charging_station_web.services.UserServices;

import jakarta.servlet.http.HttpServletRequest;

@RequestMapping("/bank")
@RestController
public class BankControllers {
    
    private final BankServices bankServices;
    private final UserServices userServices;
    public BankControllers (BankServices bankServices, UserServices userServices) {
        this.bankServices = bankServices;
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

    // get all banks (done)
    @GetMapping("/all")
    public ResponseEntity<?> getAllBanks(HttpServletRequest request) {
        try{
            Users currentUser = getUserFromToken(request);
            if (currentUser.getRole() == null) { 
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User not found"));
            }
            List<Banks> b = bankServices.findAll();
            return ResponseEntity.ok(b);
        }
        catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Bank not found"));
        } 
    }

    // create bank by admin (done)
    @PostMapping("/create") 
    public ResponseEntity<?> createBank(@RequestBody Banks bank, HttpServletRequest request){
        try{
            Users currentUser = getUserFromToken(request);
            if (currentUser.getRole() != 1) { 
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Admin only"));
            }
            Banks b = bankServices.saveBank(bank);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(b);
        }
        catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Add failed"));
        } 
    }

    // get bank by id (done)
    @GetMapping("/{bankId}")
    public ResponseEntity<?> getBankById(@PathVariable String bankId, HttpServletRequest request){
        try{
            Users currentUser = getUserFromToken(request);
            if (currentUser.getRole() == null) { 
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User not found"));
            }
            Banks b = bankServices.findBankById(bankId);
            return ResponseEntity.ok(b);
        }
        catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Bank not found"));
        } 
    }

    // update bank (for admin) (done)
    @PutMapping("/update/{bankId}")
    public ResponseEntity<?> updateBank(@PathVariable String bankId,  @RequestBody Banks bank, HttpServletRequest request) {
        try{
            Users currentUser = getUserFromToken(request);
            if (currentUser.getRole() != 1) { 
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Admin only"));
            }
            Banks update = bankServices.findBankById(bankId);
            if (bank.getBankName() != null) {
                update.setBankName(bank.getBankName());
            }
            Banks b = bankServices.saveBank(update);
            return ResponseEntity.ok(b);
        }
        catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Update failed"));
        } 
    }

    // delete bank (for admin)
    @DeleteMapping("/delete/{bankId}")
    public ResponseEntity<?> deleteBank(@PathVariable String bankId, HttpServletRequest request) {
        try{
            Users currentUser = getUserFromToken(request);
            if (currentUser.getRole() != 1) { 
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Admin only"));
            }
            Banks bank = bankServices.findBankById(bankId);
            if(bank == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Bank not found"));
            }
            return ResponseEntity.ok(bankServices.deleteBankById(bank.getId()));
        }
        catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Delete failed"));
        } 
    }
}
