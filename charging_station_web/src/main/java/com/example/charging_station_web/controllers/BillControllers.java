package com.example.charging_station_web.controllers;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import org.bson.types.ObjectId;

import com.example.charging_station_web.entities.Users;
import com.example.charging_station_web.entities.Vehicles;
import com.example.charging_station_web.entities.BankAccount;
import com.example.charging_station_web.entities.Bills;
import com.example.charging_station_web.entities.PaymentRequest;
import com.example.charging_station_web.services.BankAccountServices;
import com.example.charging_station_web.services.BillServices;
import com.example.charging_station_web.services.UserServices;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;




@RequestMapping("/bills")
@RestController
public class BillControllers {

    private final BillServices billServices;
    private final UserServices userServieces;
    private final BankAccountServices bankAccountServices;

    public BillControllers(BillServices billServices, UserServices userServieces, BankAccountServices bankAccountServices) {
        this.billServices = billServices;
        this.userServieces = userServieces;
        this.bankAccountServices = bankAccountServices;
    }

    @PostMapping("/bank/{userId}/{bankAccountId}/deposit")
    public Bills depositBill(
            @RequestBody PaymentRequest paymentRequest,
            @PathVariable String userId,
            @PathVariable String bankAccountId) {
        BankAccount bankAccount = bankAccountServices.findBankAccountById(bankAccountId);
        Double balance = bankAccount.getBalance();
        Double amount = paymentRequest.getAmount();
        if (balance < amount) {
            throw new RuntimeException("Insufficient balance");
        }
        else {
            Users user = userServieces.getUsersbyId(new ObjectId(userId));
            user.setBalance(user.getBalance() + paymentRequest.getAmount());
            userServieces.saveUsers(user);
            return billServices.createDepositBill(userId, bankAccountId, paymentRequest.getAmount());
        }
    }
    
    @PostMapping("/bank/{userId}/{bankAccountId}/withdraw")
    public Bills withdrawBill(
            @RequestBody PaymentRequest paymentRequest,
            @PathVariable String userId,
            @PathVariable String bankAccountId) {
        Users user = userServieces.getUsersbyId(new ObjectId(userId));
        Double balance = user.getBalance();
        Double amount = paymentRequest.getAmount();
        if (balance < amount) {
            throw new RuntimeException("Insufficient balance");
        }
        else {
            user.setBalance(balance - amount);
            userServieces.saveUsers(user);
            return billServices.createWithdrawBill(userId, bankAccountId, paymentRequest.getAmount());
        }
    }

    // get all bills for admin
    @GetMapping("/all")
    public List<Bills> getAllBills() {
        return billServices.findAll();
    }
    
    // get all bills for user
    @GetMapping("/{userId}/all")
    public List<Bills> getAllBillsByUserId(@PathVariable String userId) {
        return billServices.findAllByUserId(userId);
    }

    // get all bills for manager
    @GetMapping("/manager/{managerId}/all")
    public List<Bills> getAllBillsByManagerId(@PathVariable String managerId) {
        return billServices.findAllByManagerId(managerId);
    }

    // get bill by id
    @GetMapping("/{billId}")
    public Bills getBillById(@PathVariable String billId) {
        return billServices.findBillById(billId);
    }

    // create electricity bill
    @PostMapping("/create/{userId}/{chargerId}/{identifier}")
    public Bills createElectricityBill(
            @PathVariable String userId,
            @PathVariable String chargerId,
            @PathVariable String identifier) {
        Vehicles vehicle = userServieces.getVehicleByIdentifier(identifier);
        String vehicleId = vehicle.getId().toHexString();
        String payload = "ON";
        return billServices.createElecBill(userId, chargerId, vehicleId, payload);
    }

    // pause electricity bill 
    @PutMapping("/pause/{billId}")
    public Bills pauseElectricityBill(
            @PathVariable String billId) {
        Bills existingBill = billServices.findBillById(billId);
        String chargerId = existingBill.getChargerId();
        String payload = "OFF";
        return billServices.pauseElecBill(billId, chargerId, payload);
    }

    // continue electricity bill
    @PutMapping("/continue/{billId}")
    public Bills continueElectricityBill(@PathVariable String billId) {
        Bills existingBill = billServices.findBillById(billId);
        String chargerId = existingBill.getChargerId();
        String payload = "ON";
        return billServices.continueElecBill(billId, chargerId, payload);
    }

    // paid electricity bill
    @PutMapping("/paid/{billId}")
    public Bills paidElectricityBill(@PathVariable String billId) {
        return billServices.paidElecBill(billId);
    }
}
