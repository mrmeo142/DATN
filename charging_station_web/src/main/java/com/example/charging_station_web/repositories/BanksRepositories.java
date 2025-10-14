package com.example.charging_station_web.repositories;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.charging_station_web.entities.Banks;

public interface BanksRepositories extends MongoRepository<Banks, ObjectId> {
    Banks findById(String id);
    Banks deleteById(String id);
}
