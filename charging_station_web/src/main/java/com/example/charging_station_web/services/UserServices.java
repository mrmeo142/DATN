package com.example.charging_station_web.services;

import org.springframework.stereotype.Service;

import com.example.charging_station_web.repositories.AccountRepositories;
import com.example.charging_station_web.repositories.UsersRepositories;
import com.example.charging_station_web.repositories.VehicleRepository;
import com.example.charging_station_web.entities.Users;
import com.example.charging_station_web.entities.Vehicles;

import java.util.List;

@Service
public class UserServices {

    private final UsersRepositories usersRepositories;
    private final VehicleRepository vehicleRepository;
    private final AccountRepositories accountRepositories;

    public UserServices(UsersRepositories usersRepositories, VehicleRepository vehicleRepository,
                        AccountRepositories accountRepositories) {
        this.usersRepositories = usersRepositories;
        this.vehicleRepository = vehicleRepository;
        this.accountRepositories = accountRepositories;
    }
    
    // save user
    public Users saveUsers(Users user) {
        return usersRepositories.save(user);
    }

    // get users by Id
    public Users getUsersbyId(String userId) {
        return usersRepositories.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public Users findByEmail(String email) {
    return usersRepositories.findByEmail(email);
}

    // get user by email
    public Users getUsersbyEmail(String email) {
        return usersRepositories.findByEmail(email);
    }
    
    // delete user 
    public void deleteUserById(String userId) {
        vehicleRepository.deleteByUserId(userId);
        accountRepositories.deleteByUserId(userId);
        usersRepositories.deleteById(userId);
    }

    // get all users 
    public List<Users> getAllUsers() {
        return usersRepositories.findAll();
    }

    // add vehicle to user
    public Users addVehicleToUser(String userId, Vehicles vehicle) {
        Users user = usersRepositories.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
            vehicle.setUserId(userId);
            user.getVehicles().add(vehicle);
            vehicleRepository.save(vehicle);
        return usersRepositories.save(user);
    }

    // save vehicle
    public Vehicles saveVehicles(Vehicles v) {
        return vehicleRepository.save(v);
    }

    // get vehicle by Id
    public Vehicles getVehiclebyId(String vehicleId) {
        return vehicleRepository.findById(vehicleId)
            .orElseThrow(() -> new RuntimeException("Vehicle not found"));
    }

    // get all vehicles
    public List<Vehicles> getAllVehicles() {
        return vehicleRepository.findAll();
    }

    // delete vehicle from user
    public void deleteVehicleById(String vehicleId) {
        vehicleRepository.deleteById(vehicleId);
    }

    // get vehicles by identifier
    public Vehicles getVehicleByIdentifier(String identifier) {
        return vehicleRepository.findByIdentifier(identifier);
    }
}
