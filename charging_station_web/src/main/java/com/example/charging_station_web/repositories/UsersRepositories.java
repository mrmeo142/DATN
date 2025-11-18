package com.example.charging_station_web.repositories;

import com.example.charging_station_web.entities.Users;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UsersRepositories extends MongoRepository<Users, String>{
    Users findByUsername(String username);
    Users findByEmail(String email);
    Users findByIdentification(String identification);
    Users findByPhone(String phone);
}

