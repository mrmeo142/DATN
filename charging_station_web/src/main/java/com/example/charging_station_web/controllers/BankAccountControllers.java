package com.example.charging_station_web.controllers;

import java.util.List;

import org.bson.types.ObjectId;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.example.charging_station_web.entities.BankAccount;
import com.example.charging_station_web.entities.Banks;
import com.example.charging_station_web.entities.Users;
import com.example.charging_station_web.services.BankAccountServices;
import com.example.charging_station_web.services.BankServices;
import com.example.charging_station_web.services.UserServices;

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

    // get all bank accounts for admin
    @GetMapping("/admin/all")
    public List<BankAccount> getAllBankAccounts() {
        return bankAccountServices.findAll();
    }

    // create bank account 
    @PostMapping("/{userId}/create")
    public BankAccount createBankAccount(@PathVariable String userId, @RequestBody BankAccount account) {
        account.setUserId(userId);
        Users user = userServices.getUsersbyId(new ObjectId(userId));
        account.setAccountHolderName(user.getUsername());
        account.setBalance(Math.random() * 10000000);
        if(account.getBankId() != null) {
            Banks bank = bankServices.findBankById(new ObjectId (account.getBankId()));
            account.setBankName(bank.getBankName());
        }   
        return bankAccountServices.saveBankAccount(account);
    }

    // delete bank account by id
    @DeleteMapping("/delete/{accountId}")
    public String deleteBankAccount(@PathVariable String accountId) {
        return bankAccountServices.deleteBankAccountById(accountId);
    }

    // get all bank account for user
    @GetMapping("/{userId}/all")
    public List<BankAccount> getAllBankAccountsForUser(@PathVariable String userId) {
        return bankAccountServices.findAllByUserId(userId);
    }

    // get bank account by id
    @GetMapping("/{accountId}")
    public BankAccount getBankAccountById(@PathVariable String accountId) {
        return bankAccountServices.findBankAccountById(accountId);
    }

    // get bank account by bank id
    @GetMapping("/bank/{bankId}")
    public List<BankAccount> getBankAccountByBankId(@PathVariable String bankId) {
        return bankAccountServices.findAllByBankId(bankId);
    }

    // delete bank account by bank id
    @DeleteMapping("/bank/delete/{bankId}")
    public void deleteBankAccountByBankId(@PathVariable String bankId) {
        bankAccountServices.deleteBankAccountByBankId(bankId);
    }
}
