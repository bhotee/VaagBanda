import { useEffect, useRef } from 'react'
import { Animated } from 'react-native'

export function useFadeIn(delay = 0, trigger = true) {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(20)).current
  useEffect(() => {
    if (!trigger) return
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start()
  }, [trigger])
  return { opacity, translateY }
}

export function useScaleIn(delay = 0, trigger = true) {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(10)).current
  useEffect(() => {
    if (!trigger) return
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
    ]).start()
  }, [trigger])
  return { opacity, translateY }
}

export function useSlideIn(delay = 0, trigger = true) {
  const translateX = useRef(new Animated.Value(50)).current
  const opacity = useRef(new Animated.Value(0)).current
  useEffect(() => {
    if (!trigger) return
    Animated.parallel([
      Animated.timing(translateX, { toValue: 0, duration: 350, delay, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 350, delay, useNativeDriver: true }),
    ]).start()
  }, [trigger])
  return { translateX, opacity }
}
