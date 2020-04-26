import React from 'react';
import PropTypes from 'prop-types';
import { Animated, FlatList } from 'react-native';
import LogRow from './LogRow';
import moment from 'moment';
declare type DebugViewProps = {
    rows: LogRow[];
    timeStampFormat?: string;
    multiExpanded?: boolean;
    inverted: boolean;
};
interface PreparedRow extends LogRow {
    anim: Animated.Value;
    expanded: boolean;
    format?: Function;
}
declare type DebugViewState = {
    paused: boolean;
    rows: LogRow[];
    preparedRows: PreparedRow[];
    selectedEntries: string[];
};
export default class Debug extends React.Component<DebugViewProps, DebugViewState> {
    static propTypes: {
        rows: PropTypes.Requireable<LogRow[]>;
        timeStampFormat: PropTypes.Requireable<string>;
        multiExpanded: PropTypes.Requireable<boolean>;
    };
    flatlist: React.Ref<FlatList>;
    renderedRows: string[];
    constructor(props: DebugViewProps);
    prepareRows(rows: LogRow[]): PreparedRow[];
    static getDerivedStateFromProps(props: DebugViewProps, state: DebugViewState): DebugViewState | null;
    onPauseButtonPressed(): void;
    onClearButtonPressed(): void;
    _formatTimeStamp(timeStamp: moment.Moment, rowData: PreparedRow): string;
    onRowPress: (pressedRow: PreparedRow) => void;
    onRowLayout(rowData: PreparedRow): void;
    _renderSeperator(rowData: PreparedRow, animationStyle: any): JSX.Element;
    _renderLogRow: (rowData: PreparedRow, animationStyle: any) => JSX.Element;
    _renderRow: ({ item, index, separators }: {
        item: any;
        index: any;
        separators: any;
    }) => JSX.Element;
    onCenterColumnPressed(): void;
    _renderSeparator(rowID: string, adjacentRowHighlighted: boolean): JSX.Element;
    render(): JSX.Element;
}
export {};
