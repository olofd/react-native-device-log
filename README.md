/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 */
'use strict';
var React = require('react-native');

var {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  AsyncStorage
} = React;

//The device-log contains the public api that you will use in your app.
//The LogView is the GUI/Log-list that you can render at desired location //in your app:

import deviceLog, {LogView} from 'react-native-device-log';

//Call init and set a custom adapter that implements the interface of
//AsyncStorage: getItem, removeItem, setItem.
//By default the log uses a in-memory object, in this example we
//explicitly set the log to use the persistent AsyncStorage instead:

deviceLog.init(AsyncStorage, { logToConsole : false }).then(() => {

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

    setTimeout(() => {
      deviceLog.error("I'm late!!");
    }, 3000);
  },

  render: function() {
    return (
      <LogView></LogView>
    );
  }
});

AppRegistry.registerComponent('AwesomeProject', () => AwesomeProject);
