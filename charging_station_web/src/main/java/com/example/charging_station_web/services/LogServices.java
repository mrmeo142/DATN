package com.example.charging_station_web.services;

import java.time.Duration;
import java.time.LocalDateTime;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.example.charging_station_web.entities.Bills;
import com.example.charging_station_web.entities.Price;
import com.example.charging_station_web.entities.ChargingLog;
import com.example.charging_station_web.entities.MqttData;
import com.example.charging_station_web.repositories.LogRepositories;

@Service
public class LogServices {

    private final LogRepositories logRepositories;
    private final BillServices billServices;
    private final PriceServices priceServices;
    private final SimpMessagingTemplate messagingTemplate;
    public LogServices(LogRepositories logRepositories, BillServices billServices, PriceServices priceServices, SimpMessagingTemplate messagingTemplate) {
        this.logRepositories = logRepositories;
        this.billServices = billServices;
        this.priceServices = priceServices;
        this.messagingTemplate = messagingTemplate;
    }

    // save Log
    LocalDateTime lastTime = null;
    @EventListener
    public void creatLog(MqttData event){
        String chargerId = event.getChargerId();
        String billId = event.getBillId();
        Double current = event.getCurrent();
        Double voltage = event.getVoltage();
        Double temperature = event.getTemp();
        Price p = priceServices.getPrice();
        Bills bill = billServices.findBillById(billId);
        LocalDateTime create = bill.getCreatedAt();
        LocalDateTime now = LocalDateTime.now();
        Double time = Duration.between(create, now).toMillis()/3600000.0;
        //Double delta = Duration.between(lastTime, now).toMillis()/1000.0;
        Double amount = current * voltage * time * p.getPrice();
        System.out.println(p.getPrice());

        if(lastTime == null){
            if(time >= 10.0/3600.0){
            ChargingLog chg = new ChargingLog();
            chg.setChargerId(chargerId);
            chg.setBillId(billId);
            chg.setCurrent(current);
            chg.setTemperature(temperature);;
            chg.setTimestamp(now);
            chg.setVoltage(voltage);
            logRepositories.save(chg);
            System.out.println(">>> Lưu log");
            lastTime = now;
            }
        }else{
            Double delta = Duration.between(lastTime, now).toMillis()/1000.0;
            if(delta >= 10.0){
            ChargingLog chg = new ChargingLog();
            chg.setChargerId(chargerId);
            chg.setBillId(billId);
            chg.setCurrent(current);
            chg.setTemperature(temperature);;
            chg.setTimestamp(now);
            chg.setVoltage(voltage);
            logRepositories.save(chg);
            lastTime = now;
            }
        }
        System.out.println(billId + " : " +  amount + "vnd");
        messagingTemplate.convertAndSend("/topic/amount/" + billId, amount);
    }
}
