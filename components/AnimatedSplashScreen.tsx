import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring, 
  withDelay, 
  runOnJS 
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface Props {
  onAnimationFinish: () => void;
}

export default function AnimatedSplashScreen({ onAnimationFinish }: Props) {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.8);
  const translateY = useSharedValue(20);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    // 1. Scale up logo / text slightly and fade in
    scale.value = withSpring(1, { damping: 12, stiffness: 100 });
    translateY.value = withSpring(0, { damping: 12, stiffness: 100 });
    textOpacity.value = withTiming(1, { duration: 600 });

    // 2. Wait, then fade entire screen out
    opacity.value = withDelay(
      1500, // hold for 1.5 seconds
      withTiming(0, { duration: 400 })
    );

    // 3. Fallback standard timeout to ensure unmount fires and unblocks touch events
    const timer = setTimeout(() => {
      onAnimationFinish();
    }, 2100);

    return () => clearTimeout(timer);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value }
    ],
    opacity: textOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]} pointerEvents="none">
      <Animated.View style={logoStyle}>
        <Animated.Text style={styles.text}>PaisaPilot 💸</Animated.Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0f1729', // Matches native splash screen background
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  text: {
    fontSize: 46,
    color: '#ffffff',
    fontFamily: 'Outfit_700Bold',
    letterSpacing: -1,
  }
});
