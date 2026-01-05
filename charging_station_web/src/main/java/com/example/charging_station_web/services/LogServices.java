package com.example.charging_station_web.services;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.example.charging_station_web.dto.CatchEvent;
import com.example.charging_station_web.entities.Bills;
import com.example.charging_station_web.entities.Price;
import com.example.charging_station_web.entities.Users;
import com.example.charging_station_web.entities.ChargingLog;
import com.example.charging_station_web.entities.MqttData;
import com.example.charging_station_web.repositories.LogRepositories;

@Service
public class LogServices {

    private final LogRepositories logRepositories;
    private final UserServices userServices;
    private final BillServices billServices;
    private final PriceServices priceServices;
    private final ApplicationEventPublisher applicationEventPublisher;
    private final SimpMessagingTemplate messagingTemplate;
    public LogServices(LogRepositories logRepositories, BillServices billServices, 
                       PriceServices priceServices, SimpMessagingTemplate messagingTemplate,
                       UserServices userServices, ApplicationEventPublisher applicationEventPublisher) {
        this.logRepositories = logRepositories;
        this.billServices = billServices;
        this.priceServices = priceServices;
        this.userServices = userServices;
        this.applicationEventPublisher = applicationEventPublisher;
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
        Double percenatge = event.getPercenatge();
        Price p = priceServices.getPrice();
        Bills bill = billServices.findBillById(billId);
        Users user = userServices.getUsersbyId(bill.getUserId());
        LocalDateTime create = bill.getCreatedAt();
        LocalDateTime now = LocalDateTime.now();
        Double time = new BigDecimal(Duration.between(create, now).toMillis()/3600000.0)
                            .setScale(3, RoundingMode.DOWN).doubleValue();
        Double cost = bill.getAmount();
        Double totalCharger = Math.abs(current * voltage * time / 1000.0);
        Double amount = totalCharger * p.getPrice() + cost;
        
        if((user.getBalance() - amount) < p.getPrice() * 4){
            applicationEventPublisher.publishEvent(new CatchEvent(bill.getId(), "Insufficient Balance"));
        }

        if(percenatge >= 99.9){
            applicationEventPublisher.publishEvent(new CatchEvent(bill.getId(), "fully charged"));
        }

        if(lastTime == null){
            if(time >= 10.0/3600.0){
            ChargingLog chg = new ChargingLog();
            chg.setChargerId(chargerId);
            chg.setBillId(billId);
            chg.setCurrent(current);
            chg.setPercentage(percenatge);
            chg.setTimestamp(now);
            chg.setVoltage(voltage);
            logRepositories.save(chg);
            System.out.println("Lưu log");
            lastTime = now;
            }
        }else{
            Double delta = Duration.between(lastTime, now).toMillis()/1000.0;
            if(delta >= 10.0){
            ChargingLog chg = new ChargingLog();
            chg.setChargerId(chargerId);
            chg.setBillId(billId);
            chg.setCurrent(current);
            chg.setPercentage(percenatge);
            chg.setTimestamp(now);
            chg.setVoltage(voltage);
            logRepositories.save(chg);
            lastTime = now;
            }
        }
        System.out.println(billId + " : " +  amount + "vnd");
        Map<String, Double> msg = new HashMap<>();
        msg.put("current", current);
        msg.put("voltage", voltage);
        msg.put("percenatge", percenatge);
        msg.put("time", time);
        msg.put("amount", amount);
        msg.put("price", p.getPrice());
        msg.put("totalCharger", totalCharger);
        messagingTemplate.convertAndSend("/topic/log/" + billId, msg);
    }
}
