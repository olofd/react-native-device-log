import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ListView,
  Animated,
  TouchableOpacity,
  PixelRatio
} from 'react-native';
import moment from 'moment';
import debugService from './debug-service';
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const PRIMARY_COLOR = "#282828";
const SECONDARY_COLOR = "#181818";
const TEXT_COLOR = "#D6D6D6";
const LISTVIEW_REF = 'listview';
export default class Debug extends React.Component {
  constructor() {
    super();
    let ds = new ListView.DataSource({
      rowHasChanged: (r1, r2) => {
        return r1 !== r2;
      }
    });
    this.state = {
      dataSource: ds.cloneWithRows([]),
      paused: false
    };
  }

  renderList(props) {
    if (!this.state.paused) {
      let lengthDiff = props.rows.length - this.props.rows.length;
      let rows = props.rows.map((newRow, idx) => {
        let settingsObj = {
          anim: new Animated.Value(1)
        };
        if ((idx + 1) <= lengthDiff) {
          settingsObj.anim = new Animated.Value(0);
        }
        return {settingsObj: settingsObj, row: newRow};
      });
      this.setState({dataSource: this.state.dataSource.cloneWithRows(rows)});
    }
  }

  componentWillReceiveProps(nextProps) {
    this.renderList(nextProps);
  }

  onPauseButtonPressed() {
    this.setState({
      paused: !this.state.paused
    });
    this.renderList(this.props);
  }

  onClearButtonPressed() {
    debugService.clear();
  }

  _formatTimeStamp(timeStamp) {
    return timeStamp.format('HH:mm:ss');
  }

  _renderSeperator(data, animationStyle) {
    return (
      <TouchableOpacity>
        <Animated.View style={[styles.debugRowContainer, animationStyle]}>
          <Text style={styles.logRowMessage}>***</Text>
          <Text
            style={[styles.logRowMessage, styles.logRowMessageMain, styles.logRowMessageSeperator]}>{data.row.message}
            -
            {this._formatTimeStamp(data.row.timeStamp)}</Text>
          <Text style={styles.logRowMessage}>***</Text>

        </Animated.View>
      </TouchableOpacity>
    );
  }

  _renderLogRow(data, animationStyle) {
    return (
      <TouchableOpacity>
        <Animated.View style={[styles.debugRowContainer, animationStyle]}>
          <Text style={styles.logRowMessage}>
            {`[${data.row.level.toUpperCase()}]`}
          </Text>
          <Text
            style={[
            styles.logRowMessage,
            styles.logRowMessageMain, {
              color: data.row.color
            }
          ]}>{data.row.message}</Text>
          <Text style={styles.logRowMessage}>{this._formatTimeStamp(data.row.timeStamp)}</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  _renderRow(data) {
    let animation = {};
    if (data.settingsObj.anim) {
      animation = {
        backgroundColor: data.settingsObj.anim.interpolate({
          inputRange: [
            0, 0.2, 1
          ],
          outputRange: [SECONDARY_COLOR, '#388C00', SECONDARY_COLOR]
        })
      };

      Animated.timing(data.settingsObj.anim, {
        toValue: 1,
        duration: 900
      }).start();
    }

    switch (data.row.level) {
      case 'seperator':
        return this._renderSeperator(data, animation);
      default:
        return this._renderLogRow(data, animation);
    }
  }

  render() {
    const {rows, ...props} = this.props;
    return (
      <View style={styles.container}>
        <View style={styles.toolBar}>
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={this.onPauseButtonPressed.bind(this)}>
            <Text style={styles.toolbarButtonText}>
              {this.state.paused
                ? "Resume log"
                : "Pause log"}
            </Text>
          </TouchableOpacity>
          <Text style={styles.titleText}>Log</Text>
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={this.onClearButtonPressed.bind(this)}>
            <Text style={styles.toolbarButtonText}>
              Clear log
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.listContainer}>
          <ListView
            ref={LISTVIEW_REF}
            dataSource={this.state.dataSource}
            renderRow={this._renderRow.bind(this)}
            {...props} />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor : SECONDARY_COLOR
  },
  toolBar: {
    backgroundColor: SECONDARY_COLOR,
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 2,
    borderColor: PRIMARY_COLOR
  },
  toolbarButton: {
    padding: 7,
    borderWidth: 2,
    borderRadius: 7,
    borderColor: PRIMARY_COLOR
  },
  titleText: {
    flex: 1,
    color: "#FFF",
    fontWeight: 'bold',
    fontFamily: 'System',
    fontSize: 16,
    alignSelf: 'center',
    textAlign: 'center'
  },
  toolbarButtonText: {
    color: TEXT_COLOR,
    fontFamily: 'System',
    fontSize: 12
  },
  listContainer: {
    flex: 1
  },
  debugRowContainer: {
    padding: 5,
    flex: 1,
    flexDirection: 'row',
    backgroundColor: SECONDARY_COLOR,
    borderStyle: 'solid',
    borderBottomWidth: 1 / PixelRatio.get(),
    borderBottomColor: PRIMARY_COLOR
  },
  logRowMessage: {
    color: TEXT_COLOR,
    fontFamily: 'System',
    fontSize: 11,
    paddingHorizontal: 5
  },
  logRowMessageSeperator: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  logRowMessageMain: {
    flex: 1
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5
  }
});
