import React, { useState, useEffect } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { View, Text, StyleSheet, AppState } from 'react-native'
import RootNavigator from './src/navigation/RootNavigator'
import { colors } from './src/theme/colors'

function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('https://www.google.com', { method: 'HEAD' })
        setIsOnline(response.ok)
      } catch {
        setIsOnline(false)
      }
    }

    checkConnection()
    const interval = setInterval(checkConnection, 5000)
    return () => clearInterval(interval)
  }, [])

  if (isOnline) return null

  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>📡 No internet — showing cached data</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#E67E22',
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  bannerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
})

export default function App() {
  return (
    <SafeAreaProvider>
      <OfflineBanner />
      <RootNavigator />
    </SafeAreaProvider>
  )
}