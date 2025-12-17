#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "base64.h"
#include <PubSubClient.h>

// ===================
// WiFi & Server config
// ===================
const char* ssid = "MINH-HIEU 6560";
const char* password = "12341234";
const char* serverUrl = "http://178.128.209.28:8080/api/upload/";
//const char* serverUrl = "http://192.168.0.100:8080/api/upload/";
const char* chargerId = "68dd48fa560a0cc198b6e1f6";

// ===================
// Camera model (AI Thinker)
// ===================
#define CAMERA_MODEL_AI_THINKER
#include "camera_pins.h"

// ===================
// MQTT config
// ===================
const char* mqtt_server = "178.128.209.28";
//const char* mqtt_server = "192.168.0.100";
const int mqtt_port = 1883;
const char* mqtt_user = "";   // nếu broker có user/pass thì thêm vào
const char* mqtt_pass = "";
const char* topic_sub = "esp32cam/capture/68dd48fa560a0cc198b6e1f6";

WiFiClient espClient;
PubSubClient client(espClient);

// ===================
// HÀM CHỤP ẢNH VÀ GỬI LÊN SERVER
// ===================
void takePhotoAndSend() {
  // Flush frame buffer
  camera_fb_t* flush_fb = esp_camera_fb_get();
  if (flush_fb) esp_camera_fb_return(flush_fb);

  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Camera capture failed!");
    return;
  }

  Serial.printf("Captured image: %d bytes\n", fb->len);

  // Encode ảnh thành Base64
  String base64Image = base64::encode(fb->buf, fb->len);

  // Tạo JSON
  DynamicJsonDocument doc(2048);
  doc["image"] = base64Image;

  String jsonString;
  serializeJson(doc, jsonString);

  // Gửi lên server
  HTTPClient http;
  String baseUrl = String(serverUrl) + String(chargerId);
  http.begin(baseUrl.c_str());
  http.addHeader("Content-Type", "application/json");

  int httpResponseCode = http.POST(jsonString);
  if (httpResponseCode > 0) {
    Serial.printf("HTTP Response code: %d\n", httpResponseCode);
    Serial.println(http.getString());
  } else {
    Serial.printf("Error sending POST: %s\n", http.errorToString(httpResponseCode).c_str());
  }

  http.end();
  esp_camera_fb_return(fb);
  Serial.println("Done sending image.\n");
}

// ===================
// CALLBACK MQTT
// ===================
void callback(char* topic, byte* payload, unsigned int length) {
  String msg;
  for(unsigned int i = 0; i < length; i++){
    msg += (char)payload[i];
  }

  Serial.print("Received ["); Serial.print(topic); Serial.print("]: "); Serial.println(msg);

  if(msg == "capture"){
    Serial.println("Command capture received → take photo");
    takePhotoAndSend();
  }
}

// ===================
// KẾT NỐI WIFI + CAMERA
// ===================
void setup() {
  Serial.begin(115200);
  Serial.setDebugOutput(false);
  Serial.println();
  Serial.println("ESP32-CAM Image Sender Starting...");

  // --- WiFi ---
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  // --- Camera config ---
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.frame_size = FRAMESIZE_QVGA;     
  config.pixel_format = PIXFORMAT_JPEG;
  config.fb_location = CAMERA_FB_IN_PSRAM;
  config.jpeg_quality = 12;               
  config.fb_count = 1;

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed! Error 0x%x", err);
    return;
  }

  Serial.println("Camera ready!");

  // --- MQTT ---
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

// ===================
// LOOP
// ===================
void loop() {
  if(!client.connected()){
    while(!client.connected()){
      Serial.print("Connecting to MQTT...");
      if(client.connect("ESP32CAMClient", mqtt_user, mqtt_pass)){
        Serial.println("connected");
        client.subscribe(topic_sub);
      } else {
        Serial.print("failed, rc=");
        Serial.print(client.state());
        Serial.println(" try again in 5s");
        delay(5000);
      }
    }
  }
  client.loop();
  // Loại bỏ nhập bàn phím, chỉ nhận lệnh capture từ MQTT
  delay(100);
}
