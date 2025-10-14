package com.example.charging_station_web.controllers;

import java.util.List;

import org.bson.types.ObjectId;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.charging_station_web.entities.Banks;
import com.example.charging_station_web.services.BankServices;

@RequestMapping("/admin")
@RestController
public class BankControllers {
    
    private final BankServices bankServices;
    public BankControllers (BankServices bankServices) {
        this.bankServices = bankServices;
    }

    // get all banks by admin
    @GetMapping("/banks")
    public List<Banks> getAllBanks() {
        return bankServices.findAll();
    }

    // create bank by admin
    @PostMapping("/create")
    public Banks createBank(@RequestBody Banks bank){
        return bankServices.saveBank(bank);
    }

    // get bank by id
    @GetMapping("/{bankId}")
    public Banks getBankById(@PathVariable String bankId){
        return bankServices.findBankById(new ObjectId(bankId));
    }

    // update bank by admin
    @PutMapping("/update/{bankId}")
    public Banks updateBank(@PathVariable String bankId,  @RequestBody Banks bank) {
        Banks update = bankServices.findBankById(new ObjectId(bankId));
        if (bank.getBankName() != null) {
            update.setBankName(bank.getBankName());
        }
        return bankServices.saveBank(update);
    }

    // delete bank by admin
    @DeleteMapping("/delete/{bankId}")
    public String deleteBank(@PathVariable String bankId) {
        Banks bank = bankServices.findBankById(new ObjectId(bankId));
        if(bank != null) {
            bankServices.deleteBankById(bank.getId());
            return "Deleted successfully";
        } else {
            return "Bank not found";
        }
    }
}
