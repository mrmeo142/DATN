package com.example.charging_station_web.repositories;

import com.example.charging_station_web.entities.Vehicles;
import org.springframework.data.mongodb.repository.MongoRepository;

import org.bson.types.ObjectId;

public interface VehicleRepository extends MongoRepository<Vehicles, ObjectId> {
    Vehicles findById(String id);
    void deleteByUserId(String userId);
    Vehicles findByIdentifier(String identifier);
}
