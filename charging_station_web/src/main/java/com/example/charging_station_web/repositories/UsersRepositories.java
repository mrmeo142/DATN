package com.example.charging_station_web.repositories;

import com.example.charging_station_web.entities.Users;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface UsersRepositories extends MongoRepository<Users, String>{
    Users findByEmail(String email);
    Users findByIdentification(String identification);
    Users findByPhone(String phone);
    List <Users> findByRole(Integer role);
}

