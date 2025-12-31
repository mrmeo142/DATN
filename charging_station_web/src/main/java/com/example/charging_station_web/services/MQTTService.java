package com.example.charging_station_web.services;

import org.eclipse.paho.client.mqttv3.*;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.charging_station_web.entities.MqttData;

@Service
public class MQTTService {

    private final String brokerUrl = "tcp://localhost:1883";
    private final String clientId = "springboot-server";
    private final String topicSub = "esp32/mpu/+/+";

    private MqttClient mqttClient;
    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ApplicationEventPublisher eventPublisher;
    public MQTTService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
        connectAndSubscribe();
    }

    private void connectAndSubscribe() {
        try {
            mqttClient = new MqttClient(brokerUrl, clientId, new MemoryPersistence());

            MqttConnectOptions options = new MqttConnectOptions();
            options.setAutomaticReconnect(false); 
            options.setCleanSession(true);       
            options.setConnectionTimeout(10);     

            mqttClient.setCallback(new MqttCallback() {
                @Override
                public void connectionLost(Throwable cause) {
                    System.out.println("Mất kết nối broker: " + cause.getMessage());
                }

                @Override
                public void messageArrived(String topic, MqttMessage message) throws JsonMappingException, JsonProcessingException {
                    String payload = new String(message.getPayload());
                    String[] s = topic.split("/");
                    String id = s[2];
                    String billId = s[3];

                    payload = payload.replaceAll(",}", "}"); 
                    ObjectMapper mapper = new ObjectMapper();
                    JsonNode node = mapper.readTree(payload);
                    Double current = node.get("ax").asDouble();
                    Double voltage = node.get("ay").asDouble();
                    Double percenatge = node.get("az").asDouble();
                    eventPublisher.publishEvent(new MqttData(id, billId, current, voltage, percenatge));
                    messagingTemplate.convertAndSend("/topic/mqtt", 
                        "{ \"deviceId\":\"" + id + "\", \"billId\":\"" + billId + "\", \"data\":" + payload + " }");
                }

                @Override
                public void deliveryComplete(IMqttDeliveryToken token) {
                }
            });

            mqttClient.connect(options);
            mqttClient.subscribe(topicSub, 1);
            System.out.println("Đã kết nối tới broker và subscribe: " + topicSub);

        } catch (MqttException e) {
            e.printStackTrace();
        }
    }

    // Publish 
    public void publishToDevice(String deviceId, String billId, String payload) {
        try {
            String topic = "esp32/led/" + deviceId + "/" + billId ; 
            MqttMessage message = new MqttMessage(payload.getBytes());
            message.setQos(1);
            mqttClient.publish(topic, message);
            System.out.println("Published to " + topic + ": " + payload);
        } catch (MqttException e) {
            e.printStackTrace();
        }
    }

    public boolean isConnected() {
        return mqttClient != null && mqttClient.isConnected();
    }

    // Gửi lệnh chụp ảnh
    public void sendCaptureCommand(String deviceId, String payload) {
        try {
            String topic = "esp32/capture/" + deviceId; 
            MqttMessage message = new MqttMessage(payload.getBytes());
            message.setQos(1);

            mqttClient.publish(topic, message);
            System.out.println("Published to " + topic + ": " + payload);
        } catch (MqttException e) {
            e.printStackTrace();
        }
    }

}
