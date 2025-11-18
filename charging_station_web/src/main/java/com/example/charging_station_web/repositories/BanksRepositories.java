package com.example.charging_station_web.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;
import com.example.charging_station_web.entities.Banks;

public interface BanksRepositories extends MongoRepository<Banks, String> {
}
