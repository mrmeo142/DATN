package com.example.charging_station_web.repositories;

import com.example.charging_station_web.entities.Vehicles;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface VehicleRepository extends MongoRepository<Vehicles, String> {
    void deleteByUserId(String userId);
    Vehicles findByIdentifier(String identifier);
}
