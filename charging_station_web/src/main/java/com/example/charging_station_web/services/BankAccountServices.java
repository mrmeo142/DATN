package com.example.charging_station_web.services;

import java.util.List;

import org.springframework.stereotype.Service;
import com.example.charging_station_web.entities.BankAccount;

import com.example.charging_station_web.repositories.AccountRepositories;

@Service
public class BankAccountServices {

    private final AccountRepositories accountRepositories;

   public BankAccountServices(AccountRepositories accountRepositories) {
        this.accountRepositories = accountRepositories;
    }

    // save bank account
    public BankAccount saveBankAccount(BankAccount account) {
        return accountRepositories.save(account);
    }

    // find bank account by id
    public BankAccount findBankAccountById(String id) {
        return accountRepositories.findById(id);
    }

    // get all bank accounts
    public List<BankAccount> findAll() {
        return accountRepositories.findAll();
    }

    // delete bank account by id
    public String deleteBankAccountById(String id) {
        accountRepositories.deleteById(id);
        return "Deleted successfully";
    }

    // get all accounts for user
    public List<BankAccount> findAllByUserId(String userId) {
        return accountRepositories.findByUserId(userId);
    }

    // get all accounts of bank
    public List<BankAccount> findAllByBankId(String bankId) {
        return accountRepositories.findByBankId(bankId);
    }

    // delete bank account by userid
    public String deleteBankAccountByUserId(String userId) {
        accountRepositories.deleteByUserId(userId);
        return "Deleted successfully";
    }

    // delete bank account by bank id
    public void deleteBankAccountByBankId(String bankId) {
        accountRepositories.deleteByBankId(bankId);
    }
}
