import { useMemo, useRef } from 'react';
import { PanResponder, View } from 'react-native';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
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
  const scale = useSharedValue(1);
  const lastScale = useRef(1);
  const initialDistance = useRef(0);
  const initialScale = useRef(1);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

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
        scale.value = nextScale;
      },
      onPanResponderRelease: () => {
        if (lastScale.current <= 1.03) {
          lastScale.current = 1;
          scale.value = withSpring(1, { damping: 14, stiffness: 120 });
        }
      },
      onPanResponderTerminate: () => {
        if (lastScale.current <= 1.03) {
          lastScale.current = 1;
          scale.value = withSpring(1, { damping: 14, stiffness: 120 });
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
        style={[{ width: '100%', height: '100%' }, imageStyle]}
        resizeMode="contain"
      />
    </View>
  );
}
