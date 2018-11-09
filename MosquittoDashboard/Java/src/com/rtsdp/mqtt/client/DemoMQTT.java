package com.rtsdp.mqtt.client;

public class DemoMQTT {
	private static int roamount = 0;
	
	public static void main(String[] args) {
		// TODO Auto-generated method stub
		int slp = 500;
		String guageMsg = null;
		String pieChartMsg = null;
	    String cardMessage = null;
	    String clientId = "subsId";
	    String barChartMessage = null;
	    MQTTClient mqttClient = new MQTTClient();
	    
	    if (args.length != 3) {
	    	System.out.println("Usage: This program takes three arguments: mqttbrokerurl mqttusername and mqttpassword");
	    } else {
	    	MQTTClient.setBrokerURL(args[0]);
	    	MQTTClient.setUsername(args[1]);
	    	MQTTClient.setPassword(args[2]);
	    }
	    
		for (int i = 0; i < 200; ++i) {
		    // String value = getNextValue();
		    
		    int j = (int) (Math.random()*4 + 1);
		
		    if (j == 1) {
		    	guageMsg = formatGuageMessage();
		    	mqttClient.sendToMQTTBroker(clientId, "demo/guage", guageMsg, 0);
		    } else if(j == 2) {
		    	pieChartMsg = formatPieChartMessage();
		    	mqttClient.sendToMQTTBroker(clientId, "demo/piechart", pieChartMsg, 0);
		    } else if (j == 3) {
		    	cardMessage = formatCardMessage();
		    	mqttClient.sendToMQTTBroker(clientId, "demo/currencycard", cardMessage, 0);
		    } else if (j == 4){
		    	barChartMessage = formatBarChartMessage();
		    	mqttClient.sendToMQTTBroker(clientId, "demo/barchart", barChartMessage, 0);
		    }
		    try {
		        Thread.sleep(slp);
		    } catch (Exception e) {
		    	
		    }
		}

	}
	
	private static String getNextValue() {
    	
    	Integer r = new Integer(70 + (int) (Math.random() * 30));
    	return r.toString();
    }
	
	private static String formatGuageMessage() {
		String msg = null;
		msg = getNextValue();
		return msg;
		
	}
	
	private static String formatPieChartMessage() {
		String msg = null;
		msg = "[['USA', " + getNextValue() + "], ['Europe'," +  getNextValue() + "]," + 
        		"['Asia', " + getNextValue() + "]]";
		return msg;
		
	}
	
	private static String formatBarChartMessage() {
		String msg = null;
		msg = "[['Product 1', " + getNextValue() + "], ['Product 2'," +  getNextValue() + "]," + 
        		"['Product 3', " + getNextValue() + "]]";
		return msg;
		
	}
	
	private static String formatCardMessage() {
		String msg = null;
		roamount += new Integer(getNextValue());
		// msg = getNextValue2();
		msg = new Integer(roamount).toString();
		return msg;
		
	}

}
