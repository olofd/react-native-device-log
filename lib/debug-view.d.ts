import React from 'react';
import LogRow from './LogRow';
declare type DebugViewProps = {
    inverted: boolean;
};
declare type DebugViewState = {
    rows: LogRow[];
};
export default class DebugView extends React.Component<DebugViewProps, DebugViewState> {
    unmounted: boolean;
    updateDebounced: Function;
    listner?: Function;
    constructor(props: DebugViewProps);
    componentWillUnmount(): void;
    update(data: LogRow[]): void;
    componentDidMount(): void;
    render(): JSX.Element;
}
export {};
