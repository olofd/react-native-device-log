#react-native-device-log

###Description
A debug-view that prints your debug-messages in a neat listview.
Supports different levels of log-messages, complex data (With pretty printing), timers for measuring perf and much more.
Adheres to a simple, async, protocol for saving messages where you can plug in your own adapter, or
use AsyncStorage from React Native to persist log-messages between session. (Or just use simple session in-memory storage).

Also tracks Connectivity of Device and App-State-changes (Background, Idle, Active).

Will also, if you choose to (flag), track exceptions in your app and in React Native and log linenumbers and methods
so you can track crashes in production.

Configure how many messages that should be rendered in the ListView and how many messages should be persisted.
All built to be efficent and fast.

<a href="https://dl.dropboxusercontent.com/u/12645300/Screenshots/react-native-device-log.gif"><img src="https://dl.dropboxusercontent.com/u/12645300/Screenshots/react-native-device-log.gif" width="350"></a>


#Install:
```
npm install react-native-device-log --save
```
#Example:
```
/**
 * Sample React Native App width react-native-device-log
 * https://github.com/facebook/react-native
 */
import React, { Component } from 'react';
import  {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  AsyncStorage
} from 'react-native';

//The device-log contains the public api that you will use in your app.
//The LogView is the GUI/Log-list that you can render at desired location //in your app:

import deviceLog, {LogView, InMemoryAdapter} from 'react-native-device-log';

//Call init and set a custom adapter that implements the interface of
//AsyncStorage: getItem, removeItem, setItem.
//By default the log uses a in-memory object, in this example we
//explicitly set the log to use the persistent AsyncStorage instead:

deviceLog.init(AsyncStorage /* You can send new InMemoryAdapter() if you do not want to persist here*/
,{
  //Options (all optional):
  logToConsole : false, //Send logs to console as well as device-log
  logRNErrors : true, // Will pick up RN-errors and send them to the device log
  maxNumberToRender : 2000, // 0 or undefined == unlimited
  maxNumberToPersist : 2000 // 0 or undefined == unlimited
}).then(() => {

  //When the deviceLog has been initialized we can clear it if we want to:
  //deviceLog.clear();

});

//The device-log contains a timer for measuring performance:
deviceLog.startTimer('start-up');

class AwesomeProject extends Component {

  componentDidMount() {
    //Print the current time of the above timer:
    deviceLog.logTime('start-up');

    //Available log messages:
    deviceLog.log("Hello", "world!");
    deviceLog.info("A info message");
    deviceLog.debug("A debug message", {test: "test"});
    deviceLog.success("A success message");

    //Print the current time of the above timer again:
    deviceLog.logTime('start-up');

    //Later stop and remove the timer:
    //Will not print anything.
    deviceLog.stopTimer('start-up');

    setTimeout(() => {
      deviceLog.error("I'm late!!");
    }, 3000);
  }

  render() {
    /*
    inverted: will write the log inverted.
    multiExpanded: means that multiple logmessages
    that are longer then one row can be expanded simultaneously
    timeStampFormat: moment format for timeStamp
    */
    return (
      <LogView inverted={false} multiExpanded={true} timeStampFormat='HH:mm:ss'></LogView>
    );
  }
}

AppRegistry.registerComponent('AwesomeProject', () => AwesomeProject);
```
