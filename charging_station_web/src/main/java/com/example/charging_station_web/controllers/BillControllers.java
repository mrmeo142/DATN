package com.example.charging_station_web.controllers;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

import com.example.charging_station_web.entities.Users;
import com.example.charging_station_web.entities.Vehicles;
import com.example.charging_station_web.config.JwtUtil;
import com.example.charging_station_web.entities.BankAccount;
import com.example.charging_station_web.entities.Bills;
import com.example.charging_station_web.entities.PaymentRequest;
import com.example.charging_station_web.services.BankAccountServices;
import com.example.charging_station_web.services.BillServices;
import com.example.charging_station_web.services.UserServices;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;




@RequestMapping("/bills")
@RestController
public class BillControllers {

    private final BillServices billServices;
    private final UserServices userServices;
    private final BankAccountServices bankAccountServices;

    public BillControllers(BillServices billServices, UserServices userServices,
                           BankAccountServices bankAccountServices) {
        this.billServices = billServices;
        this.userServices = userServices;
        this.bankAccountServices = bankAccountServices;
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

    @PostMapping("/{bankAccountId}/deposit")
    public ResponseEntity<?> depositBill(
            @RequestBody PaymentRequest paymentRequest,
            HttpServletRequest request,
            @PathVariable String bankAccountId) {
        try{
            Users currentUser = getUserFromToken(request);
            if (currentUser.getRole() == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User not found"));
            }
            
            BankAccount bankAccount = bankAccountServices.findBankAccountById(bankAccountId);
            Double balance = bankAccount.getBalance();
            Double amount = paymentRequest.getAmount();
            if (balance < amount) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Insufficient balance"));
            }
            else {
                currentUser.setBalance(currentUser.getBalance() + paymentRequest.getAmount());
                userServices.saveUsers(currentUser);
                Bills b =  billServices.createDepositBill(currentUser.getId(), bankAccountId, paymentRequest.getAmount());
                return ResponseEntity.ok(b);
            }
        }
        catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Deposit failed"));
        }
    }
    
    @PostMapping("/{bankAccountId}/withdraw")
    public ResponseEntity<?> withdrawBill(
            @RequestBody PaymentRequest paymentRequest,
            HttpServletRequest request,
            @PathVariable String bankAccountId) {
        try{
            Users currentUser = getUserFromToken(request);
            if (currentUser.getRole() == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User not found"));
            }
            
            Double balance = currentUser.getBalance();
            Double amount = paymentRequest.getAmount();
            if (balance < amount) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Insufficient balance"));
            }
            else {
                currentUser.setBalance(balance - amount);
                userServices.saveUsers(currentUser);
                Bills b = billServices.createWithdrawBill(currentUser.getId(), bankAccountId, paymentRequest.getAmount());
                return ResponseEntity.ok(b);
            }
        }
        catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Withdraw failed"));
        }
    }

    // get all bills 
    @GetMapping("/all")
    public ResponseEntity<?> getAllBills(HttpServletRequest request) {
        try{
            Users currentUser = getUserFromToken(request);
            List<Bills> b;
            switch (currentUser.getRole()) {
                case 1: // admin
                    b = billServices.findAll();
                    break;

                case 0: // normal user
                    b = billServices.findAllByUserId(currentUser.getId());
                    break;

                case 2: // manager
                    b = billServices.findAllByManagerId(currentUser.getId());
                    break;

                default: // manager or other roles
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(Map.of("message", "User not found"));
            }
            return ResponseEntity.ok(b);
        }
        catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Bill not found"));
        }
    }

    // get bill by id
    @GetMapping("/{billId}")
    public ResponseEntity<?> getBillById(@PathVariable String billId, HttpServletRequest request) {
        try{
            Users currentUser = getUserFromToken(request);
            if (currentUser.getRole() == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User not found"));
            }
            Bills b = billServices.findBillById(billId);
            return ResponseEntity.ok(b);
        }
        catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Bill not found"));
        }
    }

    // create electricity bill
    @PostMapping("/create/{chargerId}/{identifier}")
    public ResponseEntity<?> createElectricityBill(
            HttpServletRequest request,
            @PathVariable String chargerId,
            @PathVariable String identifier) {
        try{
            Users currentUser = getUserFromToken(request);
            Vehicles vehicle = userServices.getVehicleByIdentifier(identifier);
            if (!currentUser.getId().equals(vehicle.getUserId())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User not found"));
            }
            String vehicleId = vehicle.getId();
            String payload = "ON";
            Bills b = billServices.createElecBill(currentUser.getId(), chargerId, vehicleId, payload);
            return ResponseEntity.ok(b);
        }
        catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Charging failed"));
        }
    }

    // pause electricity bill 
    @PutMapping("/pause/{billId}")
    public ResponseEntity<?> pauseElectricityBill(@PathVariable String billId, HttpServletRequest request) {
        Users currentUser = getUserFromToken(request);
        if (currentUser.getRole() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "User not found"));
        }
        Bills existingBill = billServices.findBillById(billId);
        String chargerId = existingBill.getChargerId();
        String payload = "OFF";
        Bills b = billServices.pauseElecBill(billId, chargerId, payload);
        return ResponseEntity.ok(b);
    }

    // continue electricity bill
    @PutMapping("/continue/{billId}")
    public ResponseEntity<?> continueElectricityBill(@PathVariable String billId, HttpServletRequest request) {
        try{
            Users currentUser = getUserFromToken(request);
            Bills existingBill = billServices.findBillById(billId);
            if (!currentUser.getId().equals(existingBill.getUserId())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User not found"));
            }
            String chargerId = existingBill.getChargerId();
            String payload = "ON";
            Bills b = billServices.continueElecBill(billId, chargerId, payload);
            return ResponseEntity.ok(b);
        }
        catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Charging failed"));
        }
    }

    // paid electricity bill
    @PutMapping("/paid/{billId}")
    public ResponseEntity<?> paidElectricityBill(@PathVariable String billId, HttpServletRequest request) {
        try{
            Users currentUser = getUserFromToken(request);
            if (currentUser.getRole() == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User not found"));
            }
            Bills b = billServices.paidElecBill(billId);
            return ResponseEntity.ok(b);
        }
        catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Payment failed"));
        }
    }
}
