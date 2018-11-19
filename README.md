# Mosquitto-Dashboard
A real time dashboard for monitoring Mosquitto Broker (MQTT)

I have made it easy for you to get an insight into into your Mosquitto Broker (MQTT). Download all the files. You will get a directory named MosquittoBroker.

Change these values to reflect your MQTT broker's details in **dashboard.js** file (it is inside the js directory):

```
var ip = "m10.cloudmqtt.com"; // replace this value with your brokers IP address or domain name
var port = "37629"; // port number for your broker's web socket listener. The dashboard platform will work only with websockets and
not with tcp
usessl = true; // if you are connecting to wss protocol set this to true, else false for ws
```

After you have made the above changes, double click or open MosquittoDashboard.html file in Chrome browser.

Enter your MQTT Broker user credentials. Your dashboard is up and running. All the values will get automatically updated.

View the real time dashboard live in action here: Show Dashboard . This dashboard is displaying live the metrics of the publicly available Mosquitto Broker hosted at <https://test.mosquitto.org/>.

If you want to check if all the files are in place, there is a dashboard configured out of the box for <https://test.mosquitto.org/> public MQTT Broker. Double click or open the file TestMosquittoOrgDashboard.html in Chrome browser. If it is running, then you are set. You have everything you need.

The dashboard is built for Responsive Web Design (https://en.wikipedia.org/wiki/Responsive_web_design). The dashboard is mobile device friendly. The widgets align based on mobile device's screen size.
