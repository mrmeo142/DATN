package com.example.charging_station_web.repositories;

import java.util.List;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import com.example.charging_station_web.entities.BankAccount;

public interface AccountRepositories extends MongoRepository<BankAccount, ObjectId>{
    BankAccount findById(String id);
    BankAccount deleteById(String id);
    List<BankAccount> findByBankId(String bankId);
    List<BankAccount> findByUserId(String userId);
    void deleteByBankId(String bankId);
    void deleteByUserId(String userId);
}
