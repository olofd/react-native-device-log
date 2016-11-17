#react-native-device-log

A debug-view that prints your debug-messages in a neat listview.
Supports different levels of log-messages, support complex data.
Also has a built in timer for measuring performance.

<a href="https://dl.dropboxusercontent.com/u/12645300/Screenshots/react-native-device-log.gif"><img src="https://dl.dropboxusercontent.com/u/12645300/Screenshots/react-native-device-log.gif" width="350"></a>


#Install:
```
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 */
'use strict';
import React from 'react';
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

var AwesomeProject = React.createClass({

  componentDidMount : function(){
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
  },

  render: function() {
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
});

AppRegistry.registerComponent('AwesomeProject', () => AwesomeProject);
```
