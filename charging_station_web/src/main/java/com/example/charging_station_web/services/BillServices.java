package com.example.charging_station_web.services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.example.charging_station_web.entities.Bills;
import com.example.charging_station_web.entities.Chargers;
import com.example.charging_station_web.entities.ChargingLog;
import com.example.charging_station_web.entities.Session;
import com.example.charging_station_web.repositories.AccountRepositories;
import com.example.charging_station_web.repositories.BillsRepositories;
import com.example.charging_station_web.repositories.ChargerRepositories;
import com.example.charging_station_web.repositories.LogRepositories;
import com.example.charging_station_web.repositories.UsersRepositories;
import com.example.charging_station_web.dto.CatchEvent;
import com.example.charging_station_web.entities.BankAccount;
import com.example.charging_station_web.entities.BillType;
import com.example.charging_station_web.entities.Users;

@Service
public class BillServices {

    private final BillsRepositories billsReponsitories;
    private final AccountRepositories accountRepositories;
    private final ChargerRepositories chargerRepositories;
    private final UsersRepositories userRepositories;
    private final MQTTService  mqttService; 
    private final LogRepositories logRepositories;
    private final PriceServices priceServices;
    private final SimpMessagingTemplate messagingTemplate;
    
    public BillServices(BillsRepositories billsReponsitories, AccountRepositories accountRepositories, 
                        ChargerRepositories chargerRepositories, UsersRepositories userRepositories, 
                        MQTTService  mqttService, LogRepositories logRepositories, 
                        PriceServices priceServices, SimpMessagingTemplate messagingTemplate) {
        this.billsReponsitories = billsReponsitories;
        this.accountRepositories = accountRepositories;
        this.chargerRepositories = chargerRepositories;
        this.userRepositories = userRepositories;
        this.mqttService = mqttService;
        this.logRepositories = logRepositories;
        this.priceServices = priceServices;
        this.messagingTemplate = messagingTemplate;
    }

    // -----------------------------------------------bank Bill--------------------------------------------
    
    // deposit bill
    public Bills createDepositBill(String userId, String bankAccountId, Double amount) {
        Bills bill = new Bills();
        BankAccount bankAccount = accountRepositories.findById(bankAccountId)
                    .orElseThrow(() -> new RuntimeException("Account not found"));
        Double balance = bankAccount.getBalance();
        bankAccount.setBalance(balance - amount);
        accountRepositories.save(bankAccount);
        bill.setUserId(userId);
        bill.setBankAccountId(bankAccountId);
        bill.setPaidAt(LocalDateTime.now());
        bill.setCardNumber(bankAccount.getAccountNumber());
        bill.setCardHolderName(bankAccount.getAccountHolderName());
        bill.setBankName(bankAccount.getBankName());
        bill.setDescription("Deposit Bill");
        bill.setPaid(true);
        bill.setAmount(amount);
        bill.setBillType(BillType.BANK);
        return billsReponsitories.save(bill);
    }   

    // withdraw bill
    public Bills createWithdrawBill(String userId, String bankAccountId, Double amount) {
        Bills bill = new Bills();
        BankAccount bankAccount = accountRepositories.findById(bankAccountId)
                    .orElseThrow(() -> new RuntimeException("Account not found"));
        Double balance = bankAccount.getBalance();
        bankAccount.setBalance(amount + balance); 
        accountRepositories.save(bankAccount);
        bill.setUserId(userId);
        bill.setBankAccountId(bankAccountId);
        bill.setPaidAt(LocalDateTime.now());
        bill.setCardNumber(bankAccount.getAccountNumber());
        bill.setCardHolderName(bankAccount.getAccountHolderName());
        bill.setBankName(bankAccount.getBankName());
        bill.setDescription("Withdraw Bill");
        bill.setPaid(true);
        bill.setAmount(amount);
        bill.setBillType(BillType.BANK);
        return billsReponsitories.save(bill);
    }   
    // -----------------------------------------------for all bills--------------------------------------------
    
    // find bill by id
    public Bills findBillById(String id) {
        return billsReponsitories.findById(id)
                .orElseThrow(() -> new RuntimeException("Bill not found"));
    }

    // get all bills
    public List<Bills> findAll() {
        return billsReponsitories.findAll();
    }

    // get all bills for user
    public List<Bills> findAllByUserId(String userId) {
        return billsReponsitories.findByUserId(userId);
    }

    // get all bill for manager
    public List<Bills> findAllByManagerId(String mngId){
        return billsReponsitories.findByManagerId(mngId);
    }

    // ------------------------------------Electricity Bill--------------------------------------------

    // get current draft bill for user (done)
    public Bills getCurrentDraftBill(String userId) {
        return billsReponsitories.findByUserIdAndAction(userId, "new")
                .orElse(null);
    }

    // ceate electricity bill (done)
    public Bills createElecBill(String userId, String chargerId, String vehicleId) {
        Bills bill = new Bills();
        Chargers charger = chargerRepositories.findById(chargerId)
            .orElseThrow(() -> new RuntimeException("Charger not found"));
        Users user = userRepositories.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        bill.setAmount(0.0);
        bill.setUserId(userId);
        bill.setManagerId(charger.getMngId());
        bill.setChargerId(chargerId);
        bill.setDescription("Electricity Bill");
        bill.setPaid(false);
        bill.setBillType(BillType.ElECTRIC);
        bill.setAction("new");
        bill.setUserName(user.getFullname());
        bill.setVehicleId(vehicleId);
        return billsReponsitories.save(bill);
    }

    // start electricity bill
    public Bills startElecBill(String billId, String submit) {
        Bills bill = billsReponsitories.findById(billId)
                        .orElseThrow(() -> new RuntimeException("Bill not found"));
        mqttService.publishToDevice(bill.getChargerId(), billId, submit);
        Chargers charger = chargerRepositories.findById(bill.getChargerId())
            .orElseThrow(() -> new RuntimeException("Charger not found"));
        charger.setStatus("ACTIVE");
        chargerRepositories.save(charger);
        bill.setCreatedAt(LocalDateTime.now());
        bill.setAction("Charging");
        bill.setSubmitType(submit);
        return billsReponsitories.save(bill);
    }

    // pause electricity bill
    public Bills pauseElecBill(String billId, String submit) {
        Bills bill = billsReponsitories.findById(billId)
                        .orElseThrow(() -> new RuntimeException("Bill not found"));
        mqttService.publishToDevice(bill.getChargerId(), billId, submit);
        Chargers charger = chargerRepositories.findById(bill.getChargerId())
                        .orElseThrow(() -> new RuntimeException("Charger not found"));
        charger.setStatus("OFF");
        chargerRepositories.save(charger);
        Double price = priceServices.getPrice().getPrice();            
        List<ChargingLog> logs =  logRepositories.findByBillId(billId);
        Double v = 0.0, i = 0.0;
        LocalDateTime pause = null;
        for(ChargingLog chg : logs){
            v += chg.getVoltage();
            i += chg.getCurrent();
            pause = chg.getTimestamp();
        }
        v = v/logs.size();
        i = i/logs.size();
        Session s = new Session(bill.getCreatedAt(), pause);
        Double delta = s.getDuration();
        Double cost = v * i * delta * price;
        Double amount = bill.getAmount();
        bill.setAmount(amount + Math.abs(cost));
        bill.setAction("Stop");
        bill.addSession(s);
        bill.setPauseAt(pause);
        bill.setSubmitType(submit);
        return billsReponsitories.save(bill);
    }

    // paid electricity bill
    public Bills paidElecBill(String billId){
        Bills bill = billsReponsitories.findById(billId)
                        .orElseThrow(() -> new RuntimeException("Bill not found"));
        bill.setPaidAt(LocalDateTime.now());
        Users user = userRepositories.findById(bill.getUserId())
                        .orElseThrow(() -> new RuntimeException("User not found"));
        Users manager = userRepositories.findById(bill.getManagerId())
                        .orElseThrow(() -> new RuntimeException("User not found"));
        Chargers charger = chargerRepositories.findById(bill.getChargerId())
                        .orElseThrow(() -> new RuntimeException("Charger not found"));
        System.out.println(bill.getManagerId());
        Double mng = manager.getBalance();
        Double balance = user.getBalance();
        Double amount = bill.getAmount();
        user.setBalance(balance - amount);
        manager.setBalance(mng + amount);
        userRepositories.save(user);
        userRepositories.save(manager);
        bill.setPaid(true);
        logRepositories.deleteByBillId(billId);
        charger.setStatus("OFF");
        chargerRepositories.save(charger);
        return billsReponsitories.save(bill);
    }

    @EventListener
    @Async
    public void handleOverAmountEvent(CatchEvent event) {
        String billId = event.getBillId();
        Bills bill = billsReponsitories.findById(billId)
                        .orElseThrow(() -> new RuntimeException("Bill not found"));
        mqttService.publishToDevice(bill.getChargerId(), billId, "OFF");
        Double price = priceServices.getPrice().getPrice();
        List<ChargingLog> logs =  logRepositories.findByBillId(billId);
        Double v = 0.0, i = 0.0;
        LocalDateTime pause = null;
        for(ChargingLog chg : logs){
            v += chg.getVoltage();
            i += chg.getCurrent();
            pause = chg.getTimestamp();
        }
        v = v/logs.size();
        i = i/logs.size();
        Session s = new Session(bill.getCreatedAt(), pause);
        Double delta = s.getDuration();
        Double cost = v * i * delta * price;
        Double amount = bill.getAmount();
        bill.setAmount(amount + Math.abs(cost));
        bill.setAction("Stop");
        bill.addSession(s);
        bill.setPauseAt(pause);
        bill.setStopReason(event.getReason());
        bill.setSubmitType("OFF");
        billsReponsitories.save(bill);
        messagingTemplate.convertAndSend(
        "/topic/notifications/" + bill.getUserId(),
            Map.of(
                "type", event.getReason(),
                "billId", bill.getId()
            )
        );
    }

}
