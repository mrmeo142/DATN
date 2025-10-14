package com.example.charging_station_web.services;

import java.util.List;

import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import com.example.charging_station_web.entities.Banks;
import com.example.charging_station_web.repositories.BanksRepositories;
import com.example.charging_station_web.repositories.AccountRepositories;

@Service
public class BankServices {

    private final BanksRepositories banksRepositories;
    private final AccountRepositories accountRepositories;
    public BankServices (BanksRepositories banksRepositories, AccountRepositories accountRepositories) {
        this.banksRepositories =  banksRepositories;
        this.accountRepositories = accountRepositories;
    }

    // save bank 
    public Banks saveBank(Banks bank) {
        return banksRepositories.save(bank);
    }

    // find bank by id
    public Banks findBankById(ObjectId id) {
        return banksRepositories.findById(id.toHexString());
    }
    
    // get all banks
    public List<Banks> findAll() {
        return banksRepositories.findAll();
    }

    // delete bank by id
    public String deleteBankById(ObjectId bankId) {
        accountRepositories.deleteByBankId(bankId.toHexString());
        banksRepositories.deleteById(bankId);
        return "Deleted successfully";
    }
}
