import React from 'react';
import { Animated, Dimensions, StyleSheet, Image, Text, TouchableHighlight, TouchableOpacity, View } from 'react-native';

import { Camera, Permissions, GestureHandler } from 'expo';

let dimensions = Dimensions.get('window');

export class CameraExample extends React.Component {
  state = {
    hasCameraPermission: null,
    type: Camera.Constants.Type.front,
  };

  async componentWillMount() {
    let { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({
      hasCameraPermission: (status === 'granted')
    });

    console.log(Camera.Constants);

  }

  componentDidMount() {
  }

  _takePhotoAsync = async () => {
    console.log("Snap");
    let photo = await this._camera.takePictureAsync();
    console.log("photo", photo);  

    // Flip the image
    let flippedPhoto = await Expo.ImageManipulator.manipulate(photo.uri, [{flip:{horizontal: true}}, {resize:{width: dimensions.width * 3}}], {format: 'jpeg'});

    this.props.setPhotoInfo(flippedPhoto);
  }

  render() {
    let { hasCameraPermission } = this.state;
    if (hasCameraPermission === null) {
      return (<View />);

    } else if (hasCameraPermission === false) {
      return (<Text>Camera permission not granted :( </Text>);
    } else {
      return (<View style={{
        flex: 1,
      }}>
        <Camera
          style={{ flex: 1 }} type={this.state.type} ref={(ref) => { this._camera = ref; }} >
          <TouchableHighlight style={{ flex: 1, backgroundColor: 'transparent' }} onPress={() => {
            this._takePhotoAsync();
          }}>
            <TouchableOpacity style={{
              flex: 0.1,
              alignSelf: 'flex-end',
              alignItems: 'center',
            }}
              onPress={() => {
                this.setState({
                  type: (this.state.type === Camera.Constants.Type.back ? Camera.Constants.Type.front : Camera.Constants.Type.back),
                });
              }}
            >
              <Text style={{
                fontSize: 30,
                color: 'yellow',
                fontWeight: 'bold',
                paddingHorizontal: 30,
                paddingVertical: 30,
              }}>FLIP</Text>
            </TouchableOpacity>
          </TouchableHighlight>
        </Camera>
      </View>
      );
    }
  }
}

let {
  PanGestureHandler,
  PinchGestureHandler,
  RotationGestureHandler,
  ScrollView,
  State,
} = GestureHandler;

export class PinchableBox extends React.Component {
  constructor(props) {
    super(props);

    // Pinching
    this._baseScale = new Animated.Value(1);
    this._pinchScale = new Animated.Value(1);
    this._scale = Animated.multiply(this._baseScale, this._pinchScale);
    this._lastScale = 1;
    this._onPinchGestureEvent = Animated.event(
      [{ nativeEvent: { scale: this._pinchScale } }],
      { useNativeDriver: false, }
    );

    // Rotation
    this._rotate = new Animated.Value(0);
    this._rotateStr = this._rotate.interpolate({
      inputRange: [-100, 100],
      outputRange: ['-100rad', '100rad'],
    });
    this._lastRotate = 0;
    this._onRotateGestureEvent = Animated.event(
      [{ nativeEvent: { rotation: this._rotate } }],
      { useNativeDriver: false, }
    );

    // Tilt
    this._tilt = new Animated.Value(0);
    this._tiltStr = this._tilt.interpolate({
      inputRange: [-501, -500, 0, 1],
      outputRange: ['1rad', '1rad', '0rad', '0rad'],
    });

    this._lastTilt = 0;
    this._onTiltGestureEvent = Animated.event(
      [{ nativeEvent: { translationY: this._tilt } }],
      { useNativeDriver: false, }
    );

  }

  _onRotateHandlerStateChange = (event) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      this._lastRotate += event.nativeEvent.rotation;
      this._rotate.setOffset(this._lastRotate);
      this._rotate.setValue(0);
    }
  };

  _onPinchHandlerStateChange = (event) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      this._lastScale *= event.nativeEvent.scale;
      this._baseScale.setValue(this._lastScale);
      this._pinchScale.setValue(1);
    }
  };

  _onTiltGestureStateChange = (event) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      this._lastTilt += event.nativeEvent.translationY;
      this._tilt.setOffset(this._lastTilt);
      this._tilt.setValue(0);
    }
  };

  render() {
    return (
      <PanGestureHandler
        id="image_tilt"
        onGestureEvent={this._onTiltGestureEvent}
        onHandlerStateChange={this._onTiltGestureStateChange}
        minDist={10}
        minPointers={2}
        maxPointers={2}
        avgTouches
      >
        <RotationGestureHandler
          id="image_rotation"
          simultaneousHandlers="image_pinch"
          onGestureEvent={this._onRotateGestureEvent}
          onHandlerStateChange={this._onRotateHandlerStateChange}
        >
          <PinchGestureHandler
            id="image_pinch"
            simultaneousHandlers="image_rotation"
            onGestureEvent={this._onPinchGestureEvent}
            onHandlerStateChange={this._onPinchHandlerStateChange}
          >
            <View style={styles.container} collapsable={false}>
              <Animated.Image style={[
                styles.pinchableImage,
                {
                 height: this.props.photoInfo.height / 3,
                 width: this.props.photoInfo.width / 3, 
                },
                {
                  transform: [
                    // {rotateY: '180deg'},
                    { perspective: 200 },
                    { scale: this._scale },
                    { rotate: this._rotateStr },
                    { rotateX: this._tiltStr },
                  ],
                },
              ]}
              source={{uri:this.props.photoInfo.uri}}/>
            </View>

          </PinchGestureHandler>
        </RotationGestureHandler>
      </PanGestureHandler>
    )
  }

}


class App extends React.Component {
  state = {
    photoInfo: null,
  }
  render() {

    if (!this.state.photoInfo) {
      return (<CameraExample setPhotoInfo={(info) => {
        console.log("Setting photo info to " + JSON.stringify(info));
        this.setState({photoInfo: info});
      }} />);
    } else {
      return (<PinchableBox photoInfo={this.state.photoInfo} />);
    }

  }


}

export class PhotoEditorApp extends React.Component {
  render() {
    return (
      <PinchableBox />
    );
  }
}

export default App;


const styles = StyleSheet.create({
  pinchableImage: {
    // height: 500,
    // width: 500,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
