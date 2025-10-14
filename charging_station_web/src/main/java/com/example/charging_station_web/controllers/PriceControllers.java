package com.example.charging_station_web.controllers;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.charging_station_web.entities.Price;
import com.example.charging_station_web.services.PriceServices;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PutMapping;

@RequestMapping("/price")
@RestController
public class PriceControllers {

    private final PriceServices priceServices;

    public PriceControllers(PriceServices priceServices) {
        this.priceServices = priceServices;
    }

    // create price
    @PostMapping("/create")
    public Price createPrice(@RequestBody Price price) {
        return priceServices.savePrice(price);
    }
    
    // get price
    @GetMapping("/get")
    public Price getPrice() {
        return priceServices.getPrice();
    }

    // update price
    @PutMapping("/update")
    public Price updatePrice(@RequestBody Price price) {
        Price newPrice = priceServices.getPrice();
        Double value = price.getPrice();
        newPrice.setPrice(value);
        return priceServices.savePrice(newPrice);
    }
}
