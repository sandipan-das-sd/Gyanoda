declare module 'react-native-video' {
    import { Component } from 'react';
    import { ViewStyle, TextStyle, ImageStyle, ViewProps, TextProps, StyleProp } from 'react-native';

    interface VideoProps extends ViewProps {
        source: { uri: string } | { uri: string }[];
        style?: StyleProp<ViewStyle>;
        controls?: boolean;
        resizeMode?: 'contain' | 'cover' | 'stretch';
        // Add other props as needed
    }

    export default class Video extends Component<VideoProps> { }
}
