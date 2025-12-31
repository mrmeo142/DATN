#include <ESP8266WiFi.h>
#include <PubSubClient.h>

// wifi
const char* ssid = "TP-LINK_30FA";
const char* password= "minhhue77";

// MQTT
const char* mqtt_server = "178.128.209.28";
//const char* mqtt_server = "192.168.0.100";
const int mqtt_port = 1883;
const char* mqtt_user = "";   // nếu broker có user/pass thì thêm vào
const char* mqtt_pass = "";

// MQTT_topic
const char* topic_sub = "esp32/led/68dd48fa560a0cc198b6e1f6/+";
const char* topic_capture = "esp32/capture/68dd48fa560a0cc198b6e1f6";

String topic_pub = "esp32/mpu/68dd48fa560a0cc198b6e1f6";
String topic_capture_cam = "esp32cam/capture/68dd48fa560a0cc198b6e1f6";

// buzzer pin
#define Buzzer_pin D2

WiFiClient espClient;
PubSubClient client(espClient);

bool senData = false;
String billId = "";
int a = 2, b =4, c=50;
// callback function
void callback(char* topic, byte* payload, unsigned int length){
  String msg;
  for(unsigned int i = 0; i < length; i++){
    msg += (char)payload[i];
  }

  Serial.print("Received [");
  Serial.print(topic);
  Serial.print("]: ");
  Serial.println(msg);

  if(strcmp(topic, topic_capture) == 0){
    if (msg == "capture") {
      Serial.println("Forward capture command → ESP32-CAM");
      client.publish(topic_capture_cam.c_str(), msg.c_str());
      return;
    }
  }

  String topicStr = String(topic);
  int index = topicStr.lastIndexOf("/");
  if(index > 0){
    billId = topicStr.substring(index + 1);
  }
  Serial.print("billId = " + billId);

  if(msg == "ON"){
    digitalWrite(Buzzer_pin, HIGH);
    senData = true;
    Serial.println("LED ON");
  }else{
    digitalWrite(Buzzer_pin, LOW);
    senData = false;
    Serial.println("LED OFF");
  }
}

// ket noi MQTT
void reconnect(){
  Serial.print("Connecting to MQTT...");
  if(client.connect("ESP8266Client", mqtt_user, mqtt_pass)){
    Serial.println("connected");
    client.subscribe(topic_sub);
    client.subscribe(topic_capture);
  }else{
    Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5s");
      delay(5000);
  }
}

void setup(){
  Serial.begin(9600);
  pinMode(Buzzer_pin, OUTPUT);

  //WiFi
  WiFi.begin(ssid, password);
  while(WiFi.status() != WL_CONNECTED){
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  // MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // --- Đọc lệnh từ bàn phím ---
  if (Serial.available()) {
      char cmd = Serial.read();
      if (cmd == 'c') {  // nhấn 'c' để capture
          Serial.println("User requested capture → forward to ESP32-CAM");
          client.publish(topic_capture_cam.c_str(), "capture");
      }
  }
  
  if(senData){
    String payload = "{";
    payload += "\"ax\":" + String(a) + ",";
    payload += "\"ay\":" + String(b) + ",";
    payload += "\"az\":" + String(c) + ",";
    payload += "}";

    String topic_pub_new = topic_pub + "/" + billId;
    client.publish(topic_pub_new.c_str(), payload.c_str());
    delay(2000);
  }
}