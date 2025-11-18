package com.example.charging_station_web.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;
import com.example.charging_station_web.entities.Promotion;

public interface PromRepositories extends MongoRepository<Promotion, String>{
    Promotion findByUserId(String userId);
    Promotion deleteByUserId(String userId);
}
