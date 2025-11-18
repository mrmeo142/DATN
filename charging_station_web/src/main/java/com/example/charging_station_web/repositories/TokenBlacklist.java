package com.example.charging_station_web.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.charging_station_web.entities.TokenBlackList;

public interface TokenBlacklist extends MongoRepository <TokenBlackList, String>{
    boolean existsByToken(String token);
}
