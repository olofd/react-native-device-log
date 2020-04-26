import React from 'react'
import { View, StyleSheet } from 'react-native'
import DebugListView from './debug-list-view.js'
import debugService from './debug-service'
import debounce from 'debounce'

import LogRow from './LogRow'

type DebugViewProps = {
  inverted: boolean
}

type DebugViewState = {
  rows: LogRow[]
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

export default class DebugView extends React.Component<DebugViewProps, DebugViewState> {
  unmounted: boolean
  updateDebounced: Function
  listner?: Function

  constructor(props: DebugViewProps) {
    super(props)
    this.state = {
      rows: [],
    }
    this.unmounted = false
    this.updateDebounced = debounce(this.update.bind(this), 150)
  }

  componentWillUnmount(): void {
    this.unmounted = true
    if (this.listner) {
      this.listner()
    }
  }

  update(data: LogRow[]): void {
    if (data) {
      if (!this.unmounted) {
        this.setState({ rows: data })
      }
    }
  }

  componentDidMount(): void {
    this.listner = debugService.onDebugRowsChanged(this.updateDebounced)
  }

  render(): JSX.Element {
    return (
      <View style={styles.container}>
        <DebugListView rows={this.state.rows} {...this.props} />
      </View>
    )
  }
}
