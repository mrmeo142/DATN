#include <Wire.h>
#include <Adafruit_INA219.h>
#include <EEPROM.h>
#include <SoftwareSerial.h> 
SoftwareSerial espSerial(2, 3); 

Adafruit_INA219 ina219;

// --- CẤU HÌNH ---
const float BATTERY_CAPACITY_MAH = 4200.0; 
const int EEPROM_ADDR = 0;
const float Voltage_MAX = 4.2;
const float Voltage_MIN = 3.0;

float current_capacity = 0.0;
unsigned long last_time = 0;
unsigned long save_timer = 0;

// Hàm ước lượng % theo Vôn
float estimateCapacityByVoltage(float v) {
  float p = 0.0;
  if (v <= Voltage_MIN) p = 0;
  else if (v >= Voltage_MAX) p = 100;
  else p = (v - Voltage_MIN)/(Voltage_MAX - Voltage_MIN) * 100;
  return p;
}

void setup() {
  Serial.begin(9600);
  espSerial.begin(9600); 
  
  while (!Serial) { delay(10); }

  if (!ina219.begin()) {
    Serial.println("Loi: Khong tim thay INA219");
    while (1) {}
  }

  // EEPROM.get(EEPROM_ADDR, current_capacity);
  float voltage = ina219.getBusVoltage_V();
  
  if (isnan(current_capacity) || current_capacity < 0 || current_capacity > BATTERY_CAPACITY_MAH) {
      current_capacity = estimateCapacityByVoltage(voltage)/ 100.0 * BATTERY_CAPACITY_MAH;
  }

  Serial.println("--- COULOMB COUNTING ---");
  last_time = millis();
}

void loop() {
  unsigned long current_time = millis();
  float dt_hours = (current_time - last_time) / 3600000.0;
  last_time = current_time;

  float current_mA = ina219.getCurrent_mA();
  float bus_voltage = ina219.getBusVoltage_V();

  if (current_capacity < 10.0 && bus_voltage > 3.5) {
      current_capacity = estimateCapacityByVoltage(bus_voltage)/ 100.0 * BATTERY_CAPACITY_MAH;
      Serial.println(">>> PHAT HIEN PIN MOI -> TU DONG CAP NHAT % <<<");
  }

  // --- COULOMB COUNTING ---
  if (current_mA > 2.0) {
      float charged_mAh = current_mA * dt_hours;
      current_capacity += charged_mAh; 
  }

  if (current_capacity > BATTERY_CAPACITY_MAH) current_capacity = BATTERY_CAPACITY_MAH;

  // if (bus_voltage > 4.18 && current_mA > 0) {
  //      if (current_capacity < BATTERY_CAPACITY_MAH * 0.98) {
  //          current_capacity = BATTERY_CAPACITY_MAH;
  //          Serial.println(">>> FULL SYNC <<<");
  //      }
  // }

  // if (millis() - save_timer > 60000) {
  //     EEPROM.put(EEPROM_ADDR, current_capacity);
  //     save_timer = millis();
  // }

  // Tính toán hiển thị
  float percent = 0.0;
  if(current_capacity <= 0 && current_mA <= 0){
    percent = estimateCapacityByVoltage(bus_voltage);
  }
  else{
    percent = (current_capacity / BATTERY_CAPACITY_MAH) * 100.0;
  }


  Serial.print("V: "); Serial.print(bus_voltage);
  Serial.print(" | I_Nap: "); Serial.print(current_mA); Serial.print("mA");
  Serial.print(" | Cap: "); Serial.print(current_capacity, 1);
  Serial.print("mAh | %: "); Serial.println(percent, 1);

  espSerial.println(percent, 1); 

  delay(1000);
}