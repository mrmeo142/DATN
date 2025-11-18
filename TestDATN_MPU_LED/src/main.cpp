#include <WiFi.h>
#include <PubSubClient.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Wire.h>
// WiFi
const char* ssid = "TP-LINK_30FA";
const char* password = "minhhue77";

// MQTT
const char* mqtt_server = "192.168.0.101";   // hoặc IP broker local (vd: "192.168.1.10")
const int mqtt_port = 1883;
const char* mqtt_user = "";   // nếu broker có user/pass thì thêm vào
const char* mqtt_pass = "";


// MQTT topics
const char* topic_sub = "esp32/led/68dad41878ea5f7bb76153e4/+";
String topic_pub = "esp32/mpu/68dad41878ea5f7bb76153e4";

// LED pin
#define LED_PIN 2


WiFiClient espClient;
PubSubClient client(espClient);
Adafruit_MPU6050 mpu;

bool senData = false;
String billId = "";
String deviceId = "";
// Hàm callback khi nhận dữ liệu từ MQTT
void callback(char* topic, byte* payload, unsigned int length) {
  String msg;
  for (unsigned int i = 0; i < length; i++) {
    msg += (char)payload[i];
  }

  Serial.print("Received [");
  Serial.print(topic);
  Serial.print("]: ");
  Serial.println(msg);

  String topicStr = String(topic);
  int lastSlash = topicStr.lastIndexOf("/");

  if (lastSlash > 0) {
    billId   = topicStr.substring(lastSlash + 1);
  }

  Serial.println("billId   = " + billId);

    if (msg == "ON") {
      digitalWrite(LED_PIN, HIGH);
      senData = true;
      mpu.enableSleep(false);
      Serial.println("LED ON");
    } else if (msg == "OFF") {
      digitalWrite(LED_PIN, LOW);
      senData = false;
      mpu.enableSleep(true);
      Serial.println("LED OFF");
    }
}

// Kết nối MQTT
void reconnect() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");
    if (client.connect("ESP32Client", mqtt_user, mqtt_pass)) {
      Serial.println("connected");
      client.subscribe(topic_sub);  // đăng ký nhận lệnh
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5s");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(9600);
  pinMode(LED_PIN, OUTPUT);

  // WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");

  // MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);

  // MPU6050
  if (!mpu.begin()) {
    Serial.println("Failed to find MPU6050 chip");
    while (1) { delay(10); }
  }
  Serial.println("MPU6050 found!");
  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  if(senData){
    // Đọc dữ liệu từ MPU6050
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);

    // Gửi dữ liệu qua MQTT (JSON format)
    String payload = "{";
    payload += "\"ax\":" + String(a.acceleration.x, 2) + ",";
    payload += "\"ay\":" + String(a.acceleration.y, 2) + ",";
    payload += "\"az\":" + String(a.acceleration.z, 2) + ",";
    payload += "}";

      String topic_pub_new = topic_pub + "/" + billId;
      client.publish(topic_pub_new.c_str(), payload.c_str());

    delay(2000);  
  }
}
