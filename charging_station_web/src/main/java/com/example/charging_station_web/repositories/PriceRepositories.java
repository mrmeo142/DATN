package com.example.charging_station_web.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;
import com.example.charging_station_web.entities.Price;

public interface PriceRepositories extends MongoRepository<Price, String> {

}
