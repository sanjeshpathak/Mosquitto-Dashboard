package com.rtsdp.mqtt.client;

import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.persist.MqttDefaultFilePersistence;

public class MQTTClient {
	private static String username = null;
	private static String password = null;
	private static String brokerURL = null;
	
    public static void setUsername(String username) {
		MQTTClient.username = username;
	}

	public static void setPassword(String password) {
		MQTTClient.password = password;
	}

	public static void setBrokerURL(String brokerURL) {
		MQTTClient.brokerURL = brokerURL;
	}

	// Java temporary directory location
    private static final String JAVA_TMP_DIR = System.getProperty("java.io.tmpdir");   
    
    public void sendToMQTTBroker(String clientId, String topic, String message, int qos) {
    	MqttClient mqttPublisherClient = null;
    	try {
            // Creating mqtt subscriber client
    		System.out.println("Getting Client");
    		mqttPublisherClient = getNewMqttClient(clientId);
    		
            byte[] payload = message.getBytes();
            mqttPublisherClient.publish(topic, payload, 0, true);
            System.out.println("Message published: " + message);
     	
            mqttPublisherClient.disconnect();
            System.out.println("Client Disconnected!");
        } catch (MqttException e) {
        	try {
        		mqttPublisherClient.disconnect();
        	} catch(Exception ee) {
        		System.out.println("Disconnect Error");
        	}
        	System.out.println("Error running the sample" + e.getMessage());
        }
    	
    	return;
    }

    private static MqttClient getNewMqttClient(String clientId) throws MqttException {
        //Store messages until server fetches them
        MqttDefaultFilePersistence dataStore = new MqttDefaultFilePersistence(JAVA_TMP_DIR + "/" + clientId);

        MqttClient mqttClient = new MqttClient(brokerURL, clientId, dataStore);

        MqttConnectOptions connectOptions = new MqttConnectOptions();
        
        connectOptions.setUserName(username);
        connectOptions.setPassword(password.toCharArray());
        connectOptions.setCleanSession(false);
        mqttClient.connect(connectOptions);


        return mqttClient;
    }

}
