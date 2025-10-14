package com.example.charging_station_web.repositories;

import com.example.charging_station_web.entities.Users;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UsersRepositories extends MongoRepository<Users, ObjectId>{
    Users findByUsername(String username);
    Users findByEmail(String email);
    Users findByIdentification(String identification);
    Users findByPhone(String phone);
    Users findById(String id);
    Users deleteById(String id);
}

