#react-native-device-log

A debug-view that prints your debug-messages.

<a href="https://dl.dropboxusercontent.com/u/12645300/Screenshots/react-native-device-log.gif"><img src="https://dl.dropboxusercontent.com/u/12645300/Screenshots/react-native-device-log.gif" width="350"></a>


#Install:
```
npm i react-native-device-log --save
```


#Awesome-project:

```
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 */
'use strict';
var React = require('react-native');

//The device-log contains the public api that you will use in your app.
//The LogView is the GUI/Log-list that you can render at desired location //in your app
import deviceLog, {LogView} from 'react-native-device-log';

//Call init and set a custom adapter that implements the interface of
//AsyncStorage: getItem, removeItem, setItem.
//By default the log uses a in-memory object, in this example is //explicitly set the log to use the persistant AsyncStorage insteed:
deviceLog.init(AsyncStorage);

//The device-log contains a timer for measuring performance:
deviceLog.startTimer('start-up');

var {
  AppRegistry,
  StyleSheet,
  Text,
  View,
} = React;

var AwesomeProject = React.createClass({

  componentDidMount : function(){
    //Print the current time of the above timer:
    deviceLog.logTime('start-up');

    //Avaliable log messages:
    deviceLog.log("Hello world!");
    deviceLog.info("A info message");
    deviceLog.debug("A debug message");
    deviceLog.error("A error message");
    deviceLog.success("A success message");

    //Print the current time of the above timer again:
    deviceLog.logTime('start-up');
  },

  render: function() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>
          Welcome to React Native!
        </Text>
        <Text style={styles.instructions}>
          To get started, edit index.ios.js
        </Text>
        <Text style={styles.instructions}>
          Press Cmd+R to reload,{'\n'}
          Cmd+D or shake for dev menu
        </Text>
      </View>
    );
  }
});

var styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

AppRegistry.registerComponent('AwesomeProject', () => AwesomeProject);
```
