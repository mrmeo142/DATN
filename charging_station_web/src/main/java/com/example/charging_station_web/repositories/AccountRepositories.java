package com.example.charging_station_web.repositories;

import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
import com.example.charging_station_web.entities.BankAccount;

public interface AccountRepositories extends MongoRepository<BankAccount, String>{
    List<BankAccount> findByBankId(String bankId);
    List<BankAccount> findByUserId(String userId);
    void deleteByBankId(String bankId);
    void deleteByUserId(String userId);
}
