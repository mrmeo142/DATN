package com.example.charging_station_web.controllers;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

import com.example.charging_station_web.entities.Users;
import com.example.charging_station_web.config.JwtUtil;
import com.example.charging_station_web.entities.BankAccount;
import com.example.charging_station_web.entities.Bills;
import com.example.charging_station_web.entities.PaymentRequest;
import com.example.charging_station_web.entities.Price;
import com.example.charging_station_web.services.BankAccountServices;
import com.example.charging_station_web.services.BillSchedulerServices;
import com.example.charging_station_web.services.BillServices;
import com.example.charging_station_web.services.PriceServices;
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
    private final PriceServices priceServices;
    private final BillSchedulerServices billSchedulerServices;

    public BillControllers(BillServices billServices, UserServices userServices,
            BankAccountServices bankAccountServices, PriceServices priceServices,
            BillSchedulerServices billSchedulerServices) {
        this.billServices = billServices;
        this.userServices = userServices;
        this.bankAccountServices = bankAccountServices;
        this.priceServices = priceServices;
        this.billSchedulerServices = billSchedulerServices;
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

    // deposit (done)
    @PostMapping("/{bankAccountId}/deposit")
    public ResponseEntity<?> depositBill(
            @RequestBody PaymentRequest paymentRequest,
            HttpServletRequest request,
            @PathVariable String bankAccountId) {
        try {
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
            } else {
                currentUser.setBalance(currentUser.getBalance() + paymentRequest.getAmount());
                userServices.saveUsers(currentUser);
                Bills b = billServices.createDepositBill(currentUser.getId(), bankAccountId,
                        paymentRequest.getAmount());
                return ResponseEntity.ok(b);
            }
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Deposit failed"));
        }
    }

    // withdraw (done)
    @PostMapping("/{bankAccountId}/withdraw")
    public ResponseEntity<?> withdrawBill(
            @RequestBody PaymentRequest paymentRequest,
            HttpServletRequest request,
            @PathVariable String bankAccountId) {
        try {
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
                Bills b = billServices.createWithdrawBill(currentUser.getId(), bankAccountId,
                        paymentRequest.getAmount());
                return ResponseEntity.ok(b);
            }
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Withdraw failed"));
        }
    }

    // get all bills (done)
    @GetMapping("/all/user")
    public ResponseEntity<?> getAllBillUser(HttpServletRequest request) {
        System.out.println("DEBUG: Entering /bills/all/user");
        try {
            Users currentUser = getUserFromToken(request);
            if (currentUser == null) {
                System.out.println("DEBUG: User is null in getAllBillUser");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User not found"));
            }
            System.out.println("DEBUG: User found: " + currentUser.getEmail());

            if (currentUser.getRole() == null) {
                System.out.println("DEBUG: Role is null");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User role not found"));
            }

            List<Bills> b = billServices.findAllByUserId(currentUser.getId());
            System.out.println("DEBUG: Found " + (b != null ? b.size() : 0) + " bills");
            return ResponseEntity.ok(b);
        } catch (RuntimeException e) {
            System.out.println("DEBUG: RuntimeException in getAllBillUser: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Bill not found"));
        }
    }

    // get all bills (for admin) (done)
    @GetMapping("/all/admin")
    public ResponseEntity<?> getAllBillAdmin(HttpServletRequest request) {
        try {
            Users currentUser = getUserFromToken(request);
            if (currentUser.getRole() != 1) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Admin only"));
            }
            List<Bills> b = billServices.findAll();
            return ResponseEntity.ok(b);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Bill not found"));
        }
    }

    // get all bills for manager (done)
    @GetMapping("/all/mng")
    public ResponseEntity<?> getAllBillMana(HttpServletRequest request) {
        try {
            Users currentUser = getUserFromToken(request);
            if (currentUser.getRole() != 2) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Manager only"));
            }
            List<Bills> b = billServices.findAllByManagerId(currentUser.getId());
            return ResponseEntity.ok(b);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Bill not found"));
        }
    }

    // get bill by id (done)
    @GetMapping("/{billId}")
    public ResponseEntity<?> getBillById(@PathVariable String billId, HttpServletRequest request) {
        try {
            Users currentUser = getUserFromToken(request);
            if (currentUser.getRole() == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User not found"));
            }
            Bills b = billServices.findBillById(billId);
            return ResponseEntity.ok(b);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Bill not found"));
        }
    }

    // get new bill (done)
    @GetMapping("/new")
    public ResponseEntity<?> getNewBillUser(HttpServletRequest request) {
        try {
            Users currentUser = getUserFromToken(request);
            if (currentUser.getRole() == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User not found"));
            }
            Bills draftBill = billServices.getCurrentDraftBill(currentUser.getId());
            if (draftBill == null) {
                return ResponseEntity.ok(null);
            }
            return ResponseEntity.ok(draftBill);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Bill not found"));
        }
    }

    // pause electricity bill
    @PutMapping("/pause/{billId}")
    public ResponseEntity<?> pauseElectricityBill(@PathVariable String billId, HttpServletRequest request) {
        Users currentUser = getUserFromToken(request);
        Bills existingBill = billServices.findBillById(billId);
        if (!currentUser.getId().equals(existingBill.getUserId())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "User not found"));
        }
        String payload = "OFF";
        Bills b = billServices.pauseElecBill(billId, payload);
        billSchedulerServices.scheduleAutoPayment(billId);
        return ResponseEntity.ok(b);
    }

    // start electricity bill
    @PutMapping("/start/{billId}")
    public ResponseEntity<?> startElectricityBill(@PathVariable String billId, HttpServletRequest request) {
        try {
            Users currentUser = getUserFromToken(request);
            Bills existingBill = billServices.findBillById(billId);
            if (!currentUser.getId().equals(existingBill.getUserId())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User not found"));
            }
            Price newPrice = priceServices.getPrice();
            if ((currentUser.getBalance() - existingBill.getAmount()) < newPrice.getPrice() * 4) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Insufficient balance"));
            }
            String payload = "ON";
            Bills b = billServices.startElecBill(billId, payload);
            billSchedulerServices.cancelScheduledPayment(billId);
            return ResponseEntity.ok(b);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // paid electricity bill (done)
    @PutMapping("/paid/{billId}")
    public ResponseEntity<?> paidElectricityBill(@PathVariable String billId, HttpServletRequest request) {
        try {
            Bills b = billServices.paidElecBill(billId);
            billSchedulerServices.cancelScheduledPayment(billId);
            return ResponseEntity.ok(b);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }
}
