package com.example.charging_station_web.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.charging_station_web.entities.Bills;

public interface BillsRepositories extends MongoRepository<Bills, String> {
   List<Bills> findByUserId(String userId);
   List<Bills> findByManagerId(String managerId);
   Optional<Bills> findByUserIdAndAction(String userId, String action);
}
