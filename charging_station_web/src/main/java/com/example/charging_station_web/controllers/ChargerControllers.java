package com.example.charging_station_web.controllers;

import java.util.List;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.example.charging_station_web.entities.Chargers;
import com.example.charging_station_web.entities.Users;
import com.example.charging_station_web.services.ChargerServices;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;


@RestController
@RequestMapping("/charger") 
public class ChargerControllers {

    private final ChargerServices chargerServices;

    public ChargerControllers(ChargerServices chargerServices) {
        this.chargerServices = chargerServices;
    }

    // create charger
    @PostMapping("/create")
    public Chargers createCharger(@RequestBody Chargers charger) {
        charger.setProcess("unprocessed");
        return chargerServices.saveCharger(charger);
    }

    // get charger by id
    @GetMapping("/{chargerId}")
    public Chargers getChargerById(@PathVariable String chargerId) {
        return chargerServices.findChargerById(chargerId);
    }

    // delete charger by id
    @DeleteMapping("/delete/{chargerId}")
    public String deleteChargerById(@PathVariable String chargerId) {
        return chargerServices.deleteChargerById(chargerId);
    }

    // get all chargers for manager
    @GetMapping("/manager/{mngId}")
    public List<Chargers> getAllChargersByMngId(@PathVariable String mngId) {
        return chargerServices.findAllByMngId(mngId);
    }

    // get all chargers
    @GetMapping("/all")
    public List<Chargers> getAllChargers() {
        return chargerServices.findAll();
    }

    // update charger
    @PutMapping("/update/{chargerId}")
    public Chargers updateCharger(@PathVariable String chargerId, @RequestBody Chargers charger) {
        Chargers update = chargerServices.findChargerById(chargerId);
        update.setProcess("maintenance");
        return chargerServices.saveCharger(update);
    }

    //get all chargers by process
    @GetMapping("/{userId}/process") 
    public List<Chargers> chargersByProcess(@PathVariable String userId, @RequestBody String process){
        return chargerServices.findbyProcess(process);
    }

    // add chargers for manager
    @PutMapping("manager/{userId}")
    public Users addChargers(@PathVariable String userId, @RequestParam Integer number){
        return chargerServices.addChargers(userId, number);
    }
}
