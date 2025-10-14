package com.example.charging_station_web.repositories;

import java.util.List;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.charging_station_web.entities.Bills;

public interface BillsRepositories extends MongoRepository<Bills, ObjectId> {
   Bills findById(String id);
   List<Bills> findByUserId(String id);
   List<Bills> findByManagerId(String id);
}
