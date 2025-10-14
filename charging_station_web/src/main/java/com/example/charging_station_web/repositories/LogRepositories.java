package com.example.charging_station_web.repositories;

import java.util.List;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import com.example.charging_station_web.entities.ChargingLog;

public interface LogRepositories extends MongoRepository<ChargingLog, ObjectId> {
    List<ChargingLog> findByBillId(String billId);
    void deleteByBillId(String billId);
}
