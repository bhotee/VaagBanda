const fs = require('fs')
const path = require('path')

const BASE = path.join(__dirname, 'src')

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content)
  console.log(`✅ ${path.relative(BASE, filePath)}`)
}

// ─── useAnimation.ts ───
write(path.join(BASE, 'hooks/useAnimation.ts'), `import { useEffect, useRef } from 'react'
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
`)

// ─── useNetworkStatus.ts ───
write(path.join(BASE, 'hooks/useNetworkStatus.ts'), `export function useNetworkStatus() {
  return { isOnline: true }
}
`)

// ─── offlineStorage.ts ───
write(path.join(BASE, 'lib/offlineStorage.ts'), `import AsyncStorage from '@react-native-async-storage/async-storage'

export async function saveLocally(key: string, data: any) {
  try { await AsyncStorage.setItem(key, JSON.stringify(data)) } catch {}
}

export async function getLocally(key: string) {
  try {
    const data = await AsyncStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch { return null }
}

export async function addPendingSync(action: string, data: any) {
  try {
    const pending = await getLocally('pending_sync') || []
    pending.push({ action, data, timestamp: Date.now() })
    await saveLocally('pending_sync', pending)
  } catch {}
}

export async function getPendingSync() {
  return await getLocally('pending_sync') || []
}

export async function clearPendingSync() {
  await AsyncStorage.removeItem('pending_sync')
}
`)

// ─── LogoMark.tsx ───
write(path.join(BASE, 'components/LogoMark.tsx'), `import React from 'react'
import Svg, { Path, Rect, Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg'

const CRIMSON = '#DC143C'
const BLUE = '#2E5A88'
const WHITE = '#FFFFFF'

interface Props { size?: number }

export default function LogoMark({ size = 80 }: Props) {
  const stroke = Math.max(2, size * 0.025)
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="frameGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={CRIMSON} />
          <Stop offset="100%" stopColor={BLUE} />
        </LinearGradient>
      </Defs>
      <G stroke={CRIMSON} strokeWidth={stroke} fill="none" strokeLinecap="round">
        <Path d="M 8 16 L 8 8 L 16 8" />
        <Path d="M 84 8 L 92 8 L 92 16" />
      </G>
      <G stroke={BLUE} strokeWidth={stroke} fill="none" strokeLinecap="round">
        <Path d="M 8 84 L 8 92 L 16 92" />
        <Path d="M 84 92 L 92 92 L 92 84" />
      </G>
      <Rect x="18" y="18" width="64" height="64" rx="10" fill="none" stroke="url(#frameGrad)" strokeWidth={stroke * 0.85} />
      <G fill={CRIMSON}>
        <Rect x="24" y="24" width="13" height="13" rx="2" />
        <Rect x="27" y="27" width="7" height="7" rx="1" fill={WHITE} />
        <Rect x="29" y="29" width="3" height="3" fill={CRIMSON} />
      </G>
      <G fill={BLUE}>
        <Rect x="63" y="24" width="13" height="13" rx="2" />
        <Rect x="66" y="27" width="7" height="7" rx="1" fill={WHITE} />
        <Rect x="68" y="29" width="3" height="3" fill={BLUE} />
      </G>
      <G fill={BLUE}>
        <Rect x="24" y="63" width="13" height="13" rx="2" />
        <Rect x="27" y="66" width="7" height="7" rx="1" fill={WHITE} />
        <Rect x="29" y="68" width="3" height="3" fill={BLUE} />
      </G>
      <Circle cx="44" cy="26" r="1.2" fill={CRIMSON} />
      <Circle cx="48" cy="26" r="1.2" fill={CRIMSON} />
      <Circle cx="54" cy="26" r="1.2" fill={BLUE} />
      <Circle cx="58" cy="26" r="1.2" fill={BLUE} />
      <Circle cx="44" cy="74" r="1.2" fill={CRIMSON} />
      <Circle cx="48" cy="74" r="1.2" fill={BLUE} />
      <Circle cx="54" cy="74" r="1.2" fill={BLUE} />
      <Circle cx="58" cy="74" r="1.2" fill={BLUE} />
      <Path d="M 35 42 L 41 42 L 50 64 L 50 70 L 47 70 L 44 64 L 38 50 Z" fill={CRIMSON} />
      <Path d="M 50 64 L 50 70 L 53 70 L 53 64 L 51 60 Z" fill={CRIMSON} opacity="0.9" />
      <Path d="M 56 42 L 60 42 L 70 51 L 60 51 L 60 53 L 71 65 L 60 65 L 56 65 Z" fill={BLUE} />
    </Svg>
  )
}
`)

// ─── SplashScreen.tsx ───
write(path.join(BASE, 'screens/auth/SplashScreen.tsx'), `import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native'
import LogoMark from '../../components/LogoMark'
import { colors } from '../../theme/colors'
import { typography } from '../../theme/typography'

const { width } = Dimensions.get('window')

export default function SplashScreen() {
  const logoScale = useRef(new Animated.Value(0.6)).current
  const logoOpacity = useRef(new Animated.Value(0)).current
  const titleOpacity = useRef(new Animated.Value(0)).current
  const titleY = useRef(new Animated.Value(12)).current
  const taglineOpacity = useRef(new Animated.Value(0)).current
  const taglineY = useRef(new Animated.Value(12)).current
  const loadBarWidth = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 100, friction: 8, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(titleY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(taglineY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start()
    Animated.timing(loadBarWidth, { toValue: width * 0.6, duration: 2200, useNativeDriver: false }).start()
  }, [])

  return (
    <View style={styles.container}>
      <View style={styles.circleTop} />
      <View style={styles.circleBottom} />
      <Animated.View style={[styles.logoBox, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <LogoMark size={80} />
      </Animated.View>
      <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleY }], flexDirection: 'row' }}>
        <Text style={styles.titleRed}>Vaag</Text>
        <Text style={styles.titleBlue}>Banda</Text>
      </Animated.View>
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity, transform: [{ translateY: taglineY }] }]}>
        SCAN · SPLIT · SETTLE
      </Animated.Text>
      <View style={styles.loadBarContainer}>
        <Animated.View style={[styles.loadBar, { width: loadBarWidth }]} />
      </View>
      <Text style={styles.credit}>BY CYBERSQUADNP</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  circleTop: { position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: '#DC143C25' },
  circleBottom: { position: 'absolute', bottom: -80, left: -80, width: 240, height: 240, borderRadius: 120, backgroundColor: '#ffffff10' },
  logoBox: { width: 110, height: 110, borderRadius: 28, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center', marginBottom: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 25 }, shadowOpacity: 0.3, shadowRadius: 30, elevation: 20 },
  titleRed: { fontSize: 36, fontWeight: typography.weights.bold, color: colors.primary, letterSpacing: -1 },
  titleBlue: { fontSize: 36, fontWeight: typography.weights.bold, color: colors.white, letterSpacing: -1, marginBottom: 8 },
  tagline: { fontSize: 12, color: '#ffffff90', letterSpacing: 5, fontWeight: typography.weights.medium },
  loadBarContainer: { position: 'absolute', bottom: 80, width: '60%', height: 3, backgroundColor: '#ffffff20', borderRadius: 2, overflow: 'hidden' },
  loadBar: { height: '100%', backgroundColor: colors.white, borderRadius: 2 },
  credit: { position: 'absolute', bottom: 32, fontSize: 10, color: '#ffffff50', letterSpacing: 1.5 },
})
`)

// ─── RootNavigator.tsx ───
write(path.join(BASE, 'navigation/RootNavigator.tsx'), `import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { useAuth } from '../hooks/useAuth'
import AuthNavigator from './AuthNavigator'
import MainNavigator from './MainNavigator'
import SplashScreen from '../screens/auth/SplashScreen'

export default function RootNavigator() {
  const { session, loading } = useAuth()
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500)
    return () => clearTimeout(timer)
  }, [])

  if (showSplash || loading) return <SplashScreen />

  return (
    <NavigationContainer>
      {session ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  )
}
`)

console.log('\n🎉 All files restored! Run: npx expo start --clear')