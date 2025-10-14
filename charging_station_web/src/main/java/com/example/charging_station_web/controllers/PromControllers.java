package com.example.charging_station_web.controllers;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import com.example.charging_station_web.services.UserServices;

import org.bson.types.ObjectId;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.charging_station_web.services.PromServices;
import com.example.charging_station_web.entities.Promotion;
import com.example.charging_station_web.entities.Users;

@RequestMapping("/promote")
@RestController
public class PromControllers {

    private final PromServices promServices;
    private final UserServices userServieces;

    public PromControllers(PromServices promServices, UserServices userServieces) {
        this.promServices = promServices;
        this.userServieces = userServieces;
    }

    // create promo by user
    @PostMapping("/{userId}")
    public Promotion createPromo(@PathVariable String userId,@RequestBody Promotion prom) {
        prom.setUserId(userId);
        prom.setStartDate(LocalDate.now());
        prom.setStatus("Pending");
        return promServices.savePromotion(prom);
    }

    // update promo by admin
    @PutMapping("/admin/{promId}")
    public Promotion updatePromo(@PathVariable String promId, @RequestBody Promotion prom) {
        Promotion update = promServices.getPromById(promId);
        Users promouser = userServieces.getUsersbyId(new ObjectId(update.getUserId()));
        promouser.setRole(2);
        promouser.setStations(new ArrayList<>());
        userServieces.saveUsers(promouser);
        // if (prom.getAdminId() != null) {
        //     update.setAdminId(prom.getAdminId());
        // }
        update.setStatus("Approved");
        update.setApprovedDate(LocalDate.now());
        return promServices.savePromotion(update);
    }

    // get promo by id
    @GetMapping("/{promId}")
    public Promotion getPromoById(@PathVariable String promId) {
        return promServices.getPromById(promId);
    }

    // get all promos
    @GetMapping("/managers")
    public List<Promotion> getAllPromos() {
        return promServices.findAll();
    }
}
