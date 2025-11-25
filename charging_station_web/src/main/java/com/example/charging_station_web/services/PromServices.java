package com.example.charging_station_web.services;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.charging_station_web.entities.Promotion;
import com.example.charging_station_web.repositories.PromRepositories;

@Service
public class PromServices {

    private final PromRepositories promRepositories;
    public PromServices(PromRepositories promRepositories) {
        this.promRepositories = promRepositories;
    }

        // save promotion
    public Promotion savePromotion(Promotion prom){
        return promRepositories.save(prom);
    }

    // get promotion 
    public Promotion getPromById(String id){
        return promRepositories.findById(id)
            .orElseThrow(() -> new RuntimeException("Registration not found"));
    }

    // get promotion by userId
    public Promotion getPromByUserId(String userId){
        return promRepositories.findByUserId(userId);
    }

    // get all promotions
    public List<Promotion> findAll(){
        return promRepositories.findAll();
    }
}
