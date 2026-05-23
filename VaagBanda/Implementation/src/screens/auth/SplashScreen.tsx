import React, { useEffect, useRef } from 'react'
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
