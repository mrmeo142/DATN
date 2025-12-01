package com.example.charging_station_web.services;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.charging_station_web.dto.ManagerMapDTO;
import com.example.charging_station_web.entities.Chargers;
import com.example.charging_station_web.entities.Users;
import com.example.charging_station_web.repositories.ChargerRepositories;
import com.example.charging_station_web.repositories.UsersRepositories;

@Service
public class ChargerServices {

    private final ChargerRepositories chargerRepositories;
    private final UsersRepositories usersRepositories;
    private final GeocodingService geocodingService;

    public ChargerServices(ChargerRepositories chargerRepositories, UsersRepositories usersRepositories, GeocodingService geocodingService) {
        this.chargerRepositories = chargerRepositories;
        this.usersRepositories = usersRepositories;
        this.geocodingService = geocodingService;
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
            .orElseThrow(() -> new RuntimeException("Charger not found"));
    String mngId = ch.getMngId();
    if (mngId != null) {
        Users us = usersRepositories.findById(mngId).orElse(null);
        us.getStations().removeIf(st -> st.equals(id));
        usersRepositories.save(us);
    }
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

        public List<ManagerMapDTO> getManagerLocationsForMap() {
        List<Users> managers = usersRepositories.findByRole(2);

        return managers.stream()
                .filter(manager -> manager.getAddress() != null && !manager.getAddress().trim().isEmpty())
                .map(manager -> {
                    GeocodingService.LatLng latLng = geocodingService.getLatLngFromAddress(manager.getAddress());
                    return new ManagerMapDTO(
                        manager.getId(),                                                    // String id
                        manager.getAddress(),
                        latLng != null ? latLng.lat() : 20.98097809446658,     // Sài Gòn nếu lỗi
                        latLng != null ? latLng.lng() : 105.78757742722613
                    );
                })
                .collect(Collectors.toList());
    }
}
