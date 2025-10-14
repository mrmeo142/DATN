package com.example.charging_station_web.repositories;

import com.example.charging_station_web.entities.Chargers;

import java.util.List;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ChargerRepositories extends MongoRepository<Chargers, ObjectId> {
    Chargers findById(String id);
    Chargers deleteById(String id);
    List<Chargers> findByMngId(String mngId);
    List<Chargers> findByProcess(String process);
}
