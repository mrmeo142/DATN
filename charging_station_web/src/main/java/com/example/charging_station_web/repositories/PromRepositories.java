package com.example.charging_station_web.repositories;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.charging_station_web.entities.Promotion;

public interface PromRepositories extends MongoRepository<Promotion, ObjectId>{
    Promotion findById(String id);
    Promotion findByUserId(String userId);
}
