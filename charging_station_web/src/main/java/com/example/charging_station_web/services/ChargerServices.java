package com.example.charging_station_web.services;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.charging_station_web.entities.Chargers;
import com.example.charging_station_web.entities.Users;
import com.example.charging_station_web.repositories.ChargerRepositories;
import com.example.charging_station_web.repositories.UsersRepositories;

@Service
public class ChargerServices {

    private final ChargerRepositories chargerRepositories;
    private final UsersRepositories usersRepositories;
    public ChargerServices(ChargerRepositories chargerRepositories, UsersRepositories usersRepositories) {
        this.chargerRepositories = chargerRepositories;
        this.usersRepositories = usersRepositories;
    }

    // save charger
    public Chargers saveCharger(Chargers charger) {
        return chargerRepositories.save(charger);
    }

    // find charger by id
    public Chargers findChargerById(String id) {
        return chargerRepositories.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // delete charger by id
    public String deleteChargerById(String id) {
        Chargers ch = chargerRepositories.findById(id)
                .orElseThrow(() -> new RuntimeException("Charger not found" ));
        Users us = usersRepositories.findById(ch.getMngId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        us.getStations().removeIf(st -> st.equals(id));
        usersRepositories.save(us);
        chargerRepositories.deleteById(id);
        return "Deleted successfully";
    }

    // get all chargers for manager
    public List<Chargers> findAllByMngId(String mngId) {
        return chargerRepositories.findByMngId(mngId);
    }

    // get all chargers
    public List<Chargers> findAll() {
        return chargerRepositories.findAll();
    }

    // get all chargers by process
    public List<Chargers> findbyProcess(String process){
        return chargerRepositories.findByProcess(process);
    }

    // add chargers for manager
    public Users addChargers(String userId, Integer number){
        Users manager = usersRepositories.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        List<Chargers> chargers = chargerRepositories.findByProcess("unprocessed");
        if(number > chargers.size() || chargers.isEmpty()){
            throw new RuntimeException("Not enough chargers !!!");
        }
        else{
            for(int i = 0; i < number ; i++){
                Chargers chg = chargers.get(i);
                manager.getStations().add(chg.getId());
                chg.setProcess("processed");
                chg.setMngId(userId);
                chargerRepositories.save(chg);
            }
            return usersRepositories.save(manager);
        }
    }
}
