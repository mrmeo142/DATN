package com.example.charging_station_web.services;

import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import com.example.charging_station_web.repositories.AccountRepositories;
import com.example.charging_station_web.repositories.UsersRepositories;
import com.example.charging_station_web.repositories.VehicleRepository;
import com.example.charging_station_web.entities.Users;
import com.example.charging_station_web.entities.Vehicles;

import java.util.List;
import java.util.Optional;

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
    public Users getUsersbyId(ObjectId userId) {
        return usersRepositories.findById(userId.toHexString());
    }
    // delete user (none authourized)
    public void deleteUserById(ObjectId userId) {
        vehicleRepository.deleteByUserId(userId.toHexString());
        accountRepositories.deleteByUserId(userId.toHexString());
        usersRepositories.deleteById(userId);
    }

    // get all users (non authourized)
    public List<Users> getAllUsers() {
        return usersRepositories.findAll();
    }

    // add vehicle to user
    public Users addVehicleToUser(ObjectId userId, Vehicles vehicle) {
        Optional<Users> userOptional = usersRepositories.findById(userId); // optional de xu ly ca truong hop null
        
        if (userOptional.isPresent()) {
            Users user = userOptional.get();
            vehicle.setUserId(userId.toHexString()); // tohexstring chuyen objectid sang string
            user.getVehicles().add(vehicle);
            //System.out.println(userId.toHexString());
            vehicleRepository.save(vehicle);
            return usersRepositories.save(user);
        }
        throw new RuntimeException("User not found with id: " + userId);
    }

    // save vehicle
    public Vehicles saveVehicles(Vehicles v) {
        return vehicleRepository.save(v);
    }

    // get vehicle by Id
    public Vehicles getVehiclebyId(ObjectId vehicleId) {
        return vehicleRepository.findById(vehicleId.toHexString());
    }

    // get all vehicles
    public List<Vehicles> getAllVehicles() {
        return vehicleRepository.findAll();
    }

    // delete vehicle from user
    public void deleteVehicleById(ObjectId vehicleId) {
        vehicleRepository.deleteById(vehicleId);
    }

    // get vehicles by identifier
    public Vehicles getVehicleByIdentifier(String identifier) {
        return vehicleRepository.findByIdentifier(identifier);
    }
}
