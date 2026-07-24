import { useMemo, useRef } from 'react';
import { Animated, PanResponder, View } from 'react-native';
import { useThemeColors } from '../../../../shared/presentation/ThemeContext';

function distanceBetweenTouches(touches: Array<{ pageX: number; pageY: number }>) {
  if (touches.length < 2) return 0;
  const [a, b] = touches;
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function PinchZoomImage({ uri }: { uri: string }) {
  const colors = useThemeColors();
  const scale = useRef(new Animated.Value(1)).current;
  const lastScale = useRef(1);
  const initialDistance = useRef(0);
  const initialScale = useRef(1);

  const panResponder = useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: (event) => event.nativeEvent.touches.length >= 2,
      onMoveShouldSetPanResponder: (event) => event.nativeEvent.touches.length >= 2,
      onPanResponderGrant: (event) => {
        initialDistance.current = distanceBetweenTouches(event.nativeEvent.touches);
        initialScale.current = lastScale.current;
      },
      onPanResponderMove: (event) => {
        const distance = distanceBetweenTouches(event.nativeEvent.touches);
        if (!initialDistance.current || !distance) return;

        const nextScale = clamp(
          initialScale.current * (distance / initialDistance.current),
          1,
          4,
        );
        lastScale.current = nextScale;
        scale.setValue(nextScale);
      },
      onPanResponderRelease: () => {
        if (lastScale.current <= 1.03) {
          lastScale.current = 1;
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            friction: 6,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        if (lastScale.current <= 1.03) {
          lastScale.current = 1;
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            friction: 6,
          }).start();
        }
      },
    }),
    [scale],
  );

  return (
    <View
      {...panResponder.panHandlers}
      style={{
        width: '100%',
        height: 320,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.borderSubtle,
        overflow: 'hidden',
      }}
    >
      <Animated.Image
        source={{ uri }}
        style={{
          width: '100%',
          height: '100%',
          transform: [{ scale }],
        }}
        resizeMode="contain"
      />
    </View>
  );
}
