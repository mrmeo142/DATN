package com.example.charging_station_web.repositories;

import com.example.charging_station_web.entities.Chargers;

import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ChargerRepositories extends MongoRepository<Chargers, String> {
    List<Chargers> findByMngId(String mngId);
    List<Chargers> findByProcess(String process);
    
}
