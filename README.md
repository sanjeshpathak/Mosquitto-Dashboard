# Mosquitto-Dashboard
A real time dashboard for monitoring Mosquitto Broker (MQTT)

I have made it easy for you to get an insight into into your Mosquitto Broker (MQTT). Download all the files. You will get a directory named MosquittoBroker.

Change these values to reflect your MQTT broker's details in **dashboard.js** file (it is inside the **js** directory):

```
var ip = "m10.cloudmqtt.com"; // replace this value with your brokers IP address or domain name
var port = "37629"; // port number for your broker's web socket listener. The dashboard will work only with websockets and
not with tcp
usessl = true; // if you are connecting to wss protocol set this to true, else false for ws
```

After you have made the above changes, double click or open MosquittoDashboard.html file in Chrome browser. Enter your MQTT Broker user credentials. Your dashboard is up and running. All the values will get automatically updated.

If you want to check if all the downloaded files are in place, there is a dashboard configured out of the box for <https://test.mosquitto.org/> public MQTT Broker. Double click or open the file TestMosquittoOrgDashboard.html in Chrome browser. If it is running, then you are set. You have everything you need. This Mosquitto instance is configured to accept connections anonymously. No need for username and password.

The dashboard is built for Responsive Web Design (https://en.wikipedia.org/wiki/Responsive_web_design). The dashboard is mobile device friendly. The widgets align based on mobile device's screen size. And each metric on the dashboard get automatilcally updated (or pushed) on your mobile device and as soon a new metric gets calculated and published by the broker. It is not a whole browser refresh, each metric gets updated independently. To understand how this whole thing works, see my other project mentioned below.

This dashboard is built using my other project, Real Time Streaming Dashboard Platform: <https://github.com/sanjeshpathak/realtimedashboardplatform>.

