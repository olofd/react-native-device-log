import React, { Ref } from 'react'
import PropTypes from 'prop-types'
import {
  Animated,
  FlatList,
  LayoutAnimation,
  NativeModules,
  PixelRatio,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import LogRow from './LogRow'

import debugService from './debug-service'
import moment from 'moment'
const NativeAnimatedModule = NativeModules.NativeAnimatedModule
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity)
const PRIMARY_COLOR = '#3b3b3b'
const SELECT_COLOR = '#292929'
const SEPERATOR_COLOR = 'rgb(252, 217, 28)'
const SECONDARY_COLOR = '#181818'
const TEXT_COLOR = '#D6D6D6'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SECONDARY_COLOR,
    paddingTop: 5,
  },
  toolBar: {
    backgroundColor: SECONDARY_COLOR,
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 2,
    borderColor: PRIMARY_COLOR,
  },
  toolbarButton: {
    padding: 7,
    borderWidth: 2,
    borderRadius: 7,
    borderColor: PRIMARY_COLOR,
  },
  centerColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontFamily: 'System',
    fontSize: 16,
    alignSelf: 'center',
    textAlign: 'center',
  },
  toolbarButtonText: {
    color: TEXT_COLOR,
    fontFamily: 'System',
    fontSize: 12,
  },
  listContainer: {
    flex: 1,
  },
  debugRowContainer: {
    padding: 5,
    flex: 1,
    flexDirection: 'row',
    backgroundColor: SECONDARY_COLOR,
    borderStyle: 'solid',
    borderBottomWidth: 1 / PixelRatio.get(),
    borderBottomColor: PRIMARY_COLOR,
  },
  debugRowContainerButton: {
    flexDirection: 'row',
    flex: 1,
    overflow: 'hidden',
  },
  logRowMessage: {
    color: TEXT_COLOR,
    fontFamily: 'System',
    fontSize: 11,
    paddingHorizontal: 5,
    lineHeight: 20,
  },
  logRowMessageBold: {
    fontWeight: 'bold',
  },
  logRowLevelLabel: {
    minWidth: 80,
    fontWeight: 'bold',
  },
  logRowMessageSeperator: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    color: SEPERATOR_COLOR,
  },
  seperator: {
    fontSize: 18,
    color: SEPERATOR_COLOR,
  },
  logRowMessageMain: {
    flex: 1,
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
})

type DebugViewProps = {
  rows: LogRow[]
  timeStampFormat?: string
  multiExpanded?: boolean
  inverted: boolean
}

interface PreparedRow extends LogRow {
  anim: Animated.Value
  expanded: boolean
  format?: Function
}

interface PreparedRows {
  [key: string]: PreparedRow
}

type DebugViewState = {
  paused: boolean
  rows: LogRow[]
  preparedRows: PreparedRow[]
  selectedEntries: string[]
}

export default class Debug extends React.Component<DebugViewProps, DebugViewState> {
  public static propTypes = {
    rows: PropTypes.arrayOf(PropTypes.instanceOf(LogRow)),
    timeStampFormat: PropTypes.string,
    multiExpanded: PropTypes.bool,
  }

  flatlist: React.Ref<FlatList>
  renderedRows: string[]

  constructor(props: DebugViewProps) {
    super(props)

    this.renderedRows = []
    this.state = {
      selectedEntries: [],
      paused: false,
      rows: props.rows,
      preparedRows: this.prepareRows(props.rows),
    }
  }

  prepareRows(rows: LogRow[]): PreparedRow[] {
    const preparedRows = []

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index]
      preparedRows.push({
        ...row,
        expanded: this.state.selectedEntries.indexOf(row.id) > -1,
        anim: new Animated.Value(0),
      })
    }

    return preparedRows
  }

  static getDerivedStateFromProps(props: DebugViewProps, state: DebugViewState): DebugViewState | null {
    if (!state.paused) {
      const preparedRows = []

      for (let index = 0; index < props.rows.length; index++) {
        const row = props.rows[index]
        preparedRows.push({
          ...row,
          expanded: state.selectedEntries.indexOf(row.id) > -1,
          anim: new Animated.Value(0),
        })
      }

      return {
        ...state,
        rows: props.rows,
        preparedRows,
      }
    }

    return null
  }

  onPauseButtonPressed(): void {
    this.setState({
      paused: !this.state.paused,
    })
    // this.renderList(this.props)
  }

  onClearButtonPressed(): void {
    debugService.clear()
  }

  _formatTimeStamp(timeStamp: moment.Moment, rowData: PreparedRow): string {
    if (rowData.format) {
      return rowData.format(timeStamp)
    }
    return timeStamp.format(this.props.timeStampFormat || 'HH:mm:ss')
  }

  onRowPress = (pressedRow: PreparedRow): void => {
    const { selectedEntries } = this.state

    let updatedEntries = [...selectedEntries]

    const position = selectedEntries.indexOf(pressedRow.id)
    const alreadySelected = position > -1

    if (alreadySelected) {
      updatedEntries.splice(position, 1)
    } else {
      if (this.props.multiExpanded) {
        updatedEntries.push(pressedRow.id)
      } else {
        updatedEntries = [pressedRow.id]
      }
    }

    this.setState(
      {
        selectedEntries: updatedEntries,
      },
      () => {
        const preparedRows = this.prepareRows(this.state.rows)
        LayoutAnimation.configureNext({
          update: {
            springDamping: 0.7,
            type: 'spring',
          },
          duration: 650,
        })
        this.setState({
          preparedRows,
        })
      },
    )
  }

  onRowLayout(rowData: PreparedRow): void {
    Animated.timing(rowData.anim, {
      useNativeDriver: !!NativeAnimatedModule,
      toValue: 1,
      duration: 700,
    }).start()
  }

  _renderSeperator(rowData: PreparedRow, animationStyle: any): JSX.Element {
    const seperatorStyles = [styles.logRowMessage, styles.logRowMessageBold, styles.seperator]
    return (
      <Animated.View style={[styles.debugRowContainer, animationStyle]} onLayout={this.onRowLayout.bind(this, rowData)}>
        <Text style={seperatorStyles}>*****</Text>
        <Text style={[styles.logRowMessage, styles.logRowMessageMain, styles.logRowMessageSeperator]}>
          {rowData.message}- {rowData.timeStamp.format('YYYY-MM-DD HH:mm:ss')}
        </Text>
        <Text style={seperatorStyles}>*****</Text>
      </Animated.View>
    )
  }

  _renderLogRow = (rowData: PreparedRow, animationStyle: any): JSX.Element => {
    return (
      <Animated.View
        style={[
          styles.debugRowContainer,
          animationStyle,
          {
            backgroundColor: rowData.expanded ? SELECT_COLOR : 'transparent',
          },
        ]}
        onLayout={this.onRowLayout.bind(this, rowData)}
      >
        <TouchableOpacity
          style={[
            styles.debugRowContainerButton,
            {
              maxHeight: rowData.expanded ? undefined : 25,
            },
          ]}
          onPress={this.onRowPress.bind(this, rowData)}
        >
          <Text style={[styles.logRowMessage, styles.logRowLevelLabel]}>{`[${rowData.level.toUpperCase()}]`}</Text>
          <Text
            style={[
              styles.logRowMessage,
              styles.logRowMessageMain,
              {
                color: rowData.color,
              },
            ]}
          >
            {rowData.message}
          </Text>
          <Text style={styles.logRowMessage}>{this._formatTimeStamp(rowData.timeStamp, rowData)}</Text>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  _renderRow = ({ item, index, separators }): JSX.Element => {
    const rowData = item
    let animationStyle = {}
    if (rowData.anim) {
      animationStyle = {
        opacity: rowData.anim,
        transform: [
          {
            scale: rowData.anim.interpolate({
              inputRange: [0, 0.3, 1],
              outputRange: [1, 1.05, 1],
            }),
          },
        ],
      }
    }

    switch (rowData.level) {
      case 'seperator':
        return this._renderSeperator(rowData, animationStyle)
      default:
        return this._renderLogRow(rowData, animationStyle)
    }
  }

  onCenterColumnPressed(): void {
    if (this.flatlist) {
      ;(this.flatlist as FlatList).scrollToOffset({ offset: 0, animated: true })
    }
  }

  _renderSeparator(rowID: string, adjacentRowHighlighted: boolean): JSX.Element {
    return (
      <View
        key={`${rowID}`}
        style={{
          height: adjacentRowHighlighted ? 4 : 0,
          backgroundColor: adjacentRowHighlighted ? PRIMARY_COLOR : 'transparent',
        }}
      />
    )
  }

  render(): JSX.Element {
    return (
      <View style={styles.container}>
        <View style={styles.toolBar}>
          <TouchableOpacity style={styles.toolbarButton} onPress={this.onPauseButtonPressed.bind(this)}>
            <Text style={styles.toolbarButtonText}>{this.state.paused ? 'Resume log' : 'Pause log'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={this.onCenterColumnPressed.bind(this)} style={styles.centerColumn}>
            <Text style={styles.titleText}>{`${this.state.rows.length} rows`}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolbarButton} onPress={this.onClearButtonPressed.bind(this)}>
            <Text style={styles.toolbarButtonText}>Clear log</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.listContainer}>
          <FlatList
            ref={(flRef: Ref<FlatList>): void => {
              this.flatlist = flRef
            }}
            data={this.state.preparedRows}
            renderItem={this._renderRow}
            keyExtractor={(item: PreparedRow): string => item.id}
          />
        </View>
      </View>
    )
  }
}
