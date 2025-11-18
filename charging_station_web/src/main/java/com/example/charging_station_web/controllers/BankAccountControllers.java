package com.example.charging_station_web.controllers;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.charging_station_web.config.JwtUtil;
import com.example.charging_station_web.entities.BankAccount;
import com.example.charging_station_web.entities.Banks;
import com.example.charging_station_web.entities.Users;
import com.example.charging_station_web.services.BankAccountServices;
import com.example.charging_station_web.services.BankServices;
import com.example.charging_station_web.services.UserServices;

import jakarta.servlet.http.HttpServletRequest;

@RequestMapping("/bankAccount")
@RestController
public class BankAccountControllers {

    private final BankAccountServices bankAccountServices;
    private final UserServices userServices;
    private final BankServices bankServices;

    public BankAccountControllers(BankAccountServices bankAccountServices, UserServices userServices, BankServices bankServices) {
        this.bankAccountServices = bankAccountServices;
        this.userServices = userServices;
        this.bankServices = bankServices;
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

    // get all bank accounts (for admin) (done)
    @GetMapping("/all/admin")
    public ResponseEntity<?> getAllBankAccounts(HttpServletRequest request) {
        try{
            Users currentUser = getUserFromToken(request);
            if (currentUser.getRole() != 1) { // Chỉ admin
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Access denied: Admin only"));
            }
            List<BankAccount> ac = bankAccountServices.findAll();
            return ResponseEntity.ok(ac);
        }
        catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // create bank account (done)
    @PostMapping("/create/{bankId}")
    public ResponseEntity<?> createBankAccount(HttpServletRequest request, @PathVariable String bankId, @RequestBody BankAccount account) {
        try{
            Users currentUser = getUserFromToken(request);
            if (currentUser.getRole() == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User not found"));
            }
            account.setUserId(currentUser.getId());
            account.setBankId(bankId);
            account.setBalance(Math.random() * 10000000);
            Banks bank = bankServices.findBankById(bankId);
            account.setBankName(bank.getBankName());  
            BankAccount bac = bankAccountServices.saveBankAccount(account);
            return ResponseEntity.ok(bac);
        }
        catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Create failed"));
        }
    }

    // delete bank account by id (done)
    @DeleteMapping("/delete/{accountId}")
    public ResponseEntity<?> deleteBankAccount(@PathVariable String accountId, HttpServletRequest request) {
        try{
            Users currentUser = getUserFromToken(request);
            if (currentUser.getRole() == null) { 
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User not found"));
            }
            return ResponseEntity.ok(bankAccountServices.deleteBankAccountById(accountId));
        }
        catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Delete failed"));
        }
    }

    // get all bank account for user (done)
    @GetMapping("/all")
    public ResponseEntity<?> getAllBankAccountsForUser(HttpServletRequest request) {
        try{
            Users currentUser = getUserFromToken(request);
            if (currentUser.getRole() == null) { 
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User not found"));
            }
            List<BankAccount> bac = bankAccountServices.findAllByUserId(currentUser.getId());
            return ResponseEntity.ok(bac);
        }
        catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Account not found"));
        }
    }

    // get bank account by id (done)
    @GetMapping("/{accountId}")
    public ResponseEntity<?> getBankAccountById(@PathVariable String accountId, HttpServletRequest request) {
        try{
            Users currentUser = getUserFromToken(request);
            if (currentUser.getRole() == null) { 
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User not found"));
            }
            BankAccount ac = bankAccountServices.findBankAccountById(accountId);
            return ResponseEntity.ok(ac);
        }
        catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Account not found"));
        }
    }

    // get bank account by bank id (for admin) (done)
    @GetMapping("/bank/{bankId}")
    public ResponseEntity<?> getBankAccountByBankId(@PathVariable String bankId, HttpServletRequest request) {
         try{
            Users currentUser = getUserFromToken(request);
            if (currentUser.getRole() != 1) { // Chỉ admin
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Access denied: Admin only"));
            }
            List<BankAccount> ac = bankAccountServices.findAllByBankId(bankId);
            return ResponseEntity.ok(ac);
        }
        catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

}
