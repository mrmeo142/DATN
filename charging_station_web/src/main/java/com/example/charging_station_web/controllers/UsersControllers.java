package com.example.charging_station_web.controllers;

import org.springframework.web.bind.annotation.RestController;

import com.example.charging_station_web.entities.Chargers;
import com.example.charging_station_web.entities.Users;
import com.example.charging_station_web.entities.Vehicles;
import com.example.charging_station_web.repositories.ChargerRepositories;
import com.example.charging_station_web.repositories.VehicleRepository;
import com.example.charging_station_web.services.UserServices;

import java.util.ArrayList;
import java.util.List;

import org.bson.types.ObjectId;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;


@RestController

public class UsersControllers {

    private final UserServices userServices;
    private final VehicleRepository vehicleRepository;
    private final ChargerRepositories chargerRepositories;
    
    public UsersControllers(UserServices userServices, VehicleRepository vehicleRepository, ChargerRepositories chargerRepositories) {
        this.userServices = userServices;
        this.vehicleRepository = vehicleRepository;
        this.chargerRepositories = chargerRepositories;
    }

    // create user
    @PostMapping("/create")
    public Users addUsers(@RequestBody Users user) {
        if(user.getPassword() == null || user.getPassword().length() < 6) {
            throw new RuntimeException("Password must be at least 6 characters");
        }
        user.setRole(0);
        user.setVehicles(new ArrayList<>());
        user.setBalance(0.0);
        return userServices.saveUsers(user);
    }
    
    // get user by id
    @GetMapping("/{userId}")
    public Users getUserById(@PathVariable String userId) {
        return userServices.getUsersbyId(new ObjectId(userId));
    }
    
    // update user
    @PutMapping("/{userId}")
    public Users updateUser(@PathVariable String userId, @RequestBody Users user) {
        Users update = userServices.getUsersbyId(new ObjectId(userId));
        if (user.getUsername() != null) {
            update.setUsername(user.getUsername());
        }
        if (user.getFullname() != null) {
            update.setFullname(user.getFullname());
        }
        if (user.getEmail() != null) {
            update.setEmail(user.getEmail());
        }
        if (user.getIdentification() != null) {
            update.setIdentification(user.getIdentification());
        }
        if (user.getPhone() != null) {
            update.setPhone(user.getPhone());
        }
        if (user.getBirthday() != null) {
            update.setBirthday(user.getBirthday());
        }
        if (user.getPassword() != null && user.getPassword().length() >= 6) {
            update.setPassword(user.getPassword());
        }
        return userServices.saveUsers(update);
    }
    // get all users (non authourized)
    @GetMapping("/all")
    public List<Users> getAllUsers() {
        return userServices.getAllUsers();
    }

    // delete user (none authourized)
    @DeleteMapping("/{userId}")
    public String deleteUser(@PathVariable String userId) {
        Users user = userServices.getUsersbyId(new ObjectId(userId));
        if (user != null) {
            userServices.deleteUserById(user.getId());
            return "Deleted successfully !!!";
        }
        return "User not found !";
    }

    // add vehicle of user
    @PostMapping("/{userId}/vehicles")
    public Users addVehicle(@PathVariable String userId, @RequestBody Vehicles vehicle) {
        return userServices.addVehicleToUser(new ObjectId(userId), vehicle);
    }

    // update vehicle of user
    @PutMapping("/{userId}/vehicles/{vehicleId}")
    public Vehicles updateVehicle(
            @PathVariable String userId,
            @PathVariable String vehicleId,
            @RequestBody Vehicles vehicle) {

        Users user = userServices.getUsersbyId(new ObjectId(userId));
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        for (Vehicles v : user.getVehicles()) {
            if (v.getId().toHexString().equals(vehicleId)) {
                if (vehicle.getType() != null) v.setType(vehicle.getType());
                if (vehicle.getIdentifier() != null) v.setIdentifier(vehicle.getIdentifier());
                userServices.saveUsers(user); 
                return vehicleRepository.save(v);
            }
        }

        throw new RuntimeException("Vehicle not found in user");
    }

    // delete vehicle of user
    @DeleteMapping("/{userId}/vehicles/{vehicleId}")
    public String deleteVehicle(
            @PathVariable String userId,
            @PathVariable String vehicleId) {

        Users user = userServices.getUsersbyId(new ObjectId(userId));

        for (Vehicles v : user.getVehicles()) {
            if (v.getId().toHexString().equals(vehicleId)) {
                user.getVehicles().remove(v);
                userServices.saveUsers(user); 
                userServices.deleteVehicleById(new ObjectId(vehicleId));
                return "Deleted successfully !!!";
            }
        }
        return "Vehicle not found !";
    }

    // get all vehicles
    @GetMapping("/vehicles")
    public List<Vehicles> getAllVehicles() {
        return userServices.getAllVehicles();
    }

    // get vehicle by identifier
    @GetMapping("/vehicles/{identifier}")
    public Vehicles getVehicleByIdentifier(@PathVariable String identifier) {
        return userServices.getVehicleByIdentifier(identifier);
    }

    // get vehicle by id
    @GetMapping("/vehicles/id/{vehicleId}")
    public Vehicles getVehicleById(@PathVariable String vehicleId) {
        return userServices.getVehiclebyId(new ObjectId(vehicleId));
    }

    // delete manager
    @PutMapping("delete/manager/{userId}")
    public Users deleteManager(@PathVariable String userId){
        Users user = userServices.getUsersbyId(new ObjectId(userId));
        user.setRole(0);
        List<String> stations = user.getStations();
        for(String st : stations){
            Chargers chg = chargerRepositories.findById(st);
            chg.setProcess("unprocessed");
            chargerRepositories.save(chg);
        }
        user.getStations().clear();
        return userServices.saveUsers(user);
    }
}
