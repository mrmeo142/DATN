package com.example.charging_station_web.services;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

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
import com.example.charging_station_web.entities.BankAccount;
import com.example.charging_station_web.entities.BillType;
import com.example.charging_station_web.entities.Users;

@Service
public class BillServices {

    //private final BankAccountControllers bankAccountControllers;
    private final BillsRepositories billsReponsitories;
    private final AccountRepositories accountRepositories;
    private final ChargerRepositories chargerRepositories;
    private final UsersRepositories userRepositories;
    private final MQTTService  mqttService; 
    private final LogRepositories logRepositories;
    private final PriceServices priceServices;

    
    public BillServices(BillsRepositories billsReponsitories, AccountRepositories accountRepositories, 
                        ChargerRepositories chargerRepositories, UsersRepositories userRepositories, 
                        MQTTService  mqttService, LogRepositories logRepositories, 
                        PriceServices priceServices) {
        this.billsReponsitories = billsReponsitories;
        this.accountRepositories = accountRepositories;
        this.chargerRepositories = chargerRepositories;
        this.userRepositories = userRepositories;
        this.mqttService = mqttService;
        this.logRepositories = logRepositories;
        this.priceServices = priceServices;
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

    // ceate electricity bill
    public Bills createElecBill(String userId, String chargerId, String vehicleId, String submit) {
        Bills bill = new Bills();
        Chargers charger = chargerRepositories.findById(chargerId)
            .orElseThrow(() -> new RuntimeException("Charger not found"));
        charger.setStatus("ACTIVE");
        chargerRepositories.save(charger);
        Users user = userRepositories.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        bill.setAmount(0.0);
        bill.setUserId(userId);
        bill.setManagerId(charger.getMngId());
        bill.setChargerId(chargerId);
        bill.setCreatedAt(LocalDateTime.now());
        bill.setDescription("Electricity Bill");
        bill.setPaid(false);
        bill.setBillType(BillType.ElECTRIC);
        bill.setUserName(user.getFullname());
        bill.setSubmitType(submit);
        bill.setVehicleId(vehicleId);
        Bills b = billsReponsitories.save(bill);
        String billid = b.getId();
        mqttService.publishToDevice( chargerId, billid, submit );
        return b;
    }

    // pause electricity bill
    public Bills pauseElecBill(String billId, String chargerId, String submit) {
        mqttService.publishToDevice(chargerId, billId, submit);
        Double price = priceServices.getPrice().getPrice();
        Bills bill = billsReponsitories.findById(billId)
                        .orElseThrow(() -> new RuntimeException("Bill not found"));;
        LocalDateTime pause = LocalDateTime.now();
        List<ChargingLog> logs =  logRepositories.findByBillId(billId);
        Double v = 0.0, i = 0.0;
        for(ChargingLog chg : logs){
            v += chg.getVoltage();
            i += chg.getCurrent();
        }
        v = v/logs.size();
        i = i/logs.size();
        Double delta = Duration.between(bill.getCreatedAt(), pause).toMillis()/3600000.0;
        Double cost = v * i * delta * price;
        Double amount = bill.getAmount();
        bill.setAmount(amount + cost);
        Session s = new Session(bill.getCreatedAt(), pause);
        bill.addSession(s);
        bill.setPauseAt(pause);
        bill.setSubmitType(submit);
        return billsReponsitories.save(bill);
    }

    // continue electicity bill
    public Bills continueElecBill(String billId, String chargerId, String submit) {
        mqttService.publishToDevice(chargerId, billId, submit);
        Bills bill = billsReponsitories.findById(billId)
                        .orElseThrow(() -> new RuntimeException("Bill not found"));
        bill.setCreatedAt(LocalDateTime.now());
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
        user.setBalance(balance + amount);
        manager.setBalance(mng - amount);
        userRepositories.save(user);
        userRepositories.save(manager);
        bill.setPaid(true);
        logRepositories.deleteByBillId(billId);
        charger.setStatus("OFF");
        chargerRepositories.save(charger);
        return billsReponsitories.save(bill);
    }
}
